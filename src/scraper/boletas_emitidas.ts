import { firefox } from 'playwright';
import TransactionSchema from "../models/transaction.schema";
import { ObjectId } from "mongodb";
import ProjectSchema, { IProject } from '../models/project.schema';


const browserName = firefox;
const headless = false;

async function scrapeBallotsIssued(project: IProject) {
    const browser = await browserName.launch({
        headless: headless,
        downloadsPath: 'C:\\Users\\vicen\\OneDrive\\Escritorio\\Documentos_pdf',
    });
    const page = await browser.newPage();

    try {
        console.log("Logging in...");
        await page.goto('https://loa.sii.cl/cgi_IMT/TMBCOC_MenuConsultasContrib.cgi?dummy=1461943167534');
        await page.waitForTimeout(1000);
        await page.locator('#rutcntr').fill(project.credentials.companyID);
        await page.locator('#clave').fill(project.credentials.companyPW);
        await page.waitForTimeout(1000);
        await page.locator('#bt_ingresar').click();
        await page.waitForTimeout(1000);
        console.log("Logged in successfully!");

        const dropDown = 'body > div > center > table:nth-child(4) > tbody > tr:nth-child(2) > td:nth-child(2) > div > font > select';
        await page.waitForSelector(dropDown);
        const options = await page.$$(dropDown + ' > option');

        const optionValues: string[] = [];
        for (const option of options) {
            const value = await option.getAttribute('value');
            const text = await option.textContent();
            if (value && !text?.includes('<ano>')) {
                optionValues.push(value);
            }
        }

        for (const value of optionValues) {
            await page.waitForSelector(dropDown);
            await page.selectOption(dropDown, value);
            await page.locator('xpath=//*[@id="cmdconsultar124"]').click();
            await page.waitForTimeout(1000);

            const tableSelector = 'body > div:nth-child(2) > center > table > tbody > tr:nth-child(5) > td > div > center > table > tbody > tr:nth-child(6) > td > table';
            await page.waitForSelector(tableSelector);

            const processedLinks = new Set<string>();
            let hasNewLink = true;

            while (hasNewLink) {
                hasNewLink = false;
                const rows = page.locator(`${tableSelector} tr`);
                const rowCount = await rows.count();

                for (let i = 1; i < rowCount; i++) {
                    const cell = rows.nth(i).locator('td:first-child');
                    const link = cell.locator('a');

                    if (await link.count() > 0) {
                        const href = await link.getAttribute('href');
                        if (href && !processedLinks.has(href)) {
                            processedLinks.add(href);
                            //console.log(`Clicking new link: ${href}`);

                            await link.click();
                            await page.waitForTimeout(1000);

                            const table = page.locator('body > div:nth-child(2) > center > table > tbody > tr:nth-child(5) > td > div > center > table:nth-child(2)');
                            const rows = table.locator('tbody tr');
                            const detailRowCount = await rows.count();

                            const filteredRowIndices = [];
                            for (let i = 2; i < detailRowCount - 1; i++) {
                                filteredRowIndices.push(i);
                            }

                            console.log(`Found ${filteredRowIndices.length} transactions`);

                            const tableData = [];

                            for (let i = 0; i < filteredRowIndices.length; i++) {
                                const row = rows.nth(filteredRowIndices[i]);
                                const cells = row.locator('td');
                                const cellCount = await cells.count();
                                const data = [];

                                for (let j = 0; j < cellCount; j++) {
                                    const text = (await cells.nth(j).textContent())?.trim() || "";
                                    data.push(text);
                                }

                                const imageLink = await row.locator('td a').first();
                                const href = await imageLink.getAttribute('href') || "";
                                let oversea = false;

                                    const rawDate = data[4] || "";
                                    let formattedDate = "";
                                    if (rawDate) {
                                        const [day, month, year] = rawDate.split('/');
                                        if (day && month && year) {
                                            formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                                        }
                                    }

                                    if(data[3] === 'VIG'){
                                        data[3] = 'Documento Emitido Vigente'
                                    } else {
                                        data[3] = 'Documento Emitido Anulado'
                                    }

                                    const realDate = new Date(Date.parse(formattedDate));

                                    const folioExists = await TransactionSchema.exists({ externalID: data[3] });

                                    if (project.startDate>realDate || realDate>project.endDate || folioExists) {
                                        continue;
                                    }

                                    tableData.push({
                                        receptor: data[8] || "",
                                        razon_social: data[9] || "",
                                        documento: data[3] || "",
                                        folio: 'E-B-' + data[8] + '-' + (data[2] || ""),
                                        fecha: formattedDate || "",
                                        bruto: (data[10] || "").replace(/[.,]/g, ""),
                                        retenidoEmisor: (data[11] || "").replace(/[.,]/g, ""),
                                        retenidoReceptor: (data[12] || "").replace(/[.,]/g, ""),
                                        liquido: (data[13] || "").replace(/[.,]/g, ""),
                                        estado: data[3] || "",
                                        path: href,
                                        oversea: oversea,
                                    });
                                }

                            // Download PDFs
                            for (const [index, entry] of tableData.entries()) {
                                const link = rows.nth(filteredRowIndices[index]).locator('td a img[src="/IMT/img/pdf.gif"]');
                                if (await link.count() > 0) {
                                    await link.click();
                                    await page.waitForTimeout(1000);
                                }
                            }
                            //Save data to MongoDB

                            const transactions = tableData.map(entry => ({
                                type: entry.documento,
                                date: entry.fecha,
                                externalID: entry.folio,
                                lastSync: new Date(),
                                client: entry.receptor + " " + entry.razon_social,
                                description: "",
                                total: entry.bruto,
                                status: entry.estado,
                                paymentStatus: "",
                                rawValue: {
                                    bruto: entry.bruto,
                                    retenidoEmisor: entry.retenidoEmisor,
                                    retenidoReceptor: entry.retenidoReceptor,
                                    liquido:entry.liquido,
                                },
                                project: project._id, //675a62b59a7dd064adb8d292
                                path: "",
                                received: false,
                                oversea: entry.oversea,
                            }));
                            
                            await TransactionSchema.insertMany(transactions);
                            console.log(`Saved ${transactions.length} transactions to MongoDB`);

                            // Go back
                            await page.locator('body > div:nth-child(2) > center > table > tbody > tr:nth-child(5) > td > div > center > table:nth-child(3) > tbody > tr > td > form:nth-child(5) > table > tbody > tr > td:nth-child(1) > div > font > input[type=button]').click();
                            await page.waitForSelector(tableSelector);
                            hasNewLink = true;
                            break;
                        }
                    }
                }
            }

            await page.waitForTimeout(1000);
            await page.locator('body > div:nth-child(2) > center > table > tbody > tr:nth-child(5) > td > div > center > table > tbody > tr:nth-child(6) > td > form > table > tbody > tr > td:nth-child(1) > div > font > input[type=button]').click();
            await page.waitForTimeout(1000);
        }

    } catch (error) {
        console.error("Scraping error:", error);
    } finally {
        console.log("Closing the browser...");
        await browser.close();
    }
}

// Run the scraper
export {scrapeBallotsIssued}