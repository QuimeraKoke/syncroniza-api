import { firefox } from 'playwright';
import TransactionSchema from "../models/transaction.schema";
import { ObjectId } from "mongodb";
import ProjectSchema, { IProject } from '../models/project.schema';



const browserName = firefox
const headless = false
let Boletas = 0;

async function scrapeDocumentsReceived(project: IProject) {
    const browser = await browserName.launch({
        headless: headless,
        downloadsPath: 'C:\\Users\\vicen\\OneDrive\\Escritorio\\Documentos_pdf',

    });
    const page = await browser.newPage();

    try {
        console.log("Logging in...");
        await page.goto('https://www.sii.cl/servicios_online/1039-1183.html');
        await page.waitForTimeout(1000);
        await page.locator('xpath=//*[@id="headingTwo"]/h4/a').click();
        await page.waitForTimeout(1000);
        await page.locator('xpath=//*[@id="collapseTwo"]/div/ul/li[2]/a').click();
        await page.locator('#rutcntr').fill(project.credentials.representativeID);
        await page.locator('#clave').fill(project.credentials.representativePW);
        await page.waitForTimeout(1000);
        await page.locator('#bt_ingresar').click();
        console.log("Logged in successfully!");

        while (true) {
            await page.waitForTimeout(3000);
            const nextPageButtonVisible = await page.isVisible('#pagina_siguiente');

            if (nextPageButtonVisible) {
                console.log("Next page button visible, extracting data...");

                await page.waitForSelector('#tablaDatos');
                const table = page.locator('#tablaDatos');
                const rows = table.locator('tbody tr');
                const rowCount = await rows.count();

                console.log(`Found ${rowCount} transactions`);

                // Extract table data
                const tableData = [];

                for (let i = 0; i < rowCount; i++) {
                    const row = rows.nth(i);
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

                        if (data[3] === 'Factura Electronica'){
                            data[3] = 'FACTURA'
                            data[4] = 'R-'+'F-'+data[1]+'-'+data[4]
                        } else if (data[3] === 'Factura Exenta Electronica'){
                            data[3] = 'FACTURA'
                            data[4] = 'R-'+'FX-'+data[1]+'-'+data[4]
                        } else if (data[3] === 'Factura de Compra Electronica'){
                            data[3] = 'FACTURA'
                            data[4] = 'R-'+'FC-'+data[1]+'-'+data[4]
                        } else if (data[3] === 'Nota de Debito Electronica'){
                            data[3] = 'NNDD'
                            data[4] = 'R-'+'ND-'+data[1]+'-'+data[4]
                        } else if (data[3] === 'Nota de Credito Electronica'){
                            data[3] = 'NNCC'
                            data[4] = 'R-'+'NC-'+data[1]+'-'+data[4]
                        } else if (data[3] === 'Guia de Despacho Electronica'){
                            data[3] = 'GGDD'
                            data[4] = 'R-'+'GD-'+data[1]+'-'+data[4]
                        } else if (data[3] === 'Boleta Electronica'){
                            data[3] = 'BOLETA'
                            data[4] = 'R-'+'BL-'+data[1]+'-'+data[4]
                        }

                        const realDate = new Date(Date.parse(data[5]))
                        const folioExists = await TransactionSchema.exists({externalID: data[4]});

                        if((project.startDate<realDate && realDate>project.endDate) || folioExists){
                            continue
                        }

                        tableData.push({
                            receptor: data[1] || "",
                            razon_social: data[2] || "",
                            documento: data[3] || "",
                            folio: data[4] || "",
                            fecha: data[5] || "",
                            monto: data[6] || "",
                            estado: data[7] || "",
                            path: href,
                            oversea: oversea,
                        });
                    }

                //console.log('Extracted Data:', tableData);

                for (const entry of tableData) {        
                    const link = await page.locator(`a[href="${entry.path}"]`);
                    await link.click({ button: 'middle' });
                    const newTab = await page.context().waitForEvent('page');
                    await newTab.waitForTimeout(1000);
                    await newTab.locator('xpath=//*[@id="headingOtros"]/h5/a').click();
                    const downloadButtonVisible = await newTab.isVisible('xpath=//*[@id="collapseOtros"]/div/div[8]/p/a[1]');
                    if(downloadButtonVisible){
                        await newTab.locator('xpath=//*[@id="collapseOtros"]/div/div[8]/p/a[1]').click({ button: 'middle' });
                        const downloadTab = await page.context().waitForEvent('page');
                        await downloadTab.close();
                        await newTab.close();
                    } else {
                        Boletas++
                        await newTab.close();
                    }
                }

                //Save data to MongoDB

                const transactions = tableData.map(entry => ({
                    type: entry.documento,
                    date: entry.fecha,
                    externalID: entry.folio,
                    lastSync: new Date(),
                    client: entry.emisor + " " + entry.razon_social,
                    description: "",
                    total: entry.monto,
                    status: entry.estado,
                    paymentStatus: "",
                    rawValue: "",
                    project: project._id,
                    path: "",
                    received: true,
                    oversea: entry.oversea,
                }));

                await TransactionSchema.insertMany(transactions);
                console.log(`Saved ${transactions.length} transactions to MongoDB`);

                // Click to go to the next page
                await page.waitForTimeout(5000);
                await page.locator('#pagina_siguiente').click();

            } else {
                console.log("No next page button visible, extracting final data...");

                await page.waitForSelector('#tablaDatos');
                const table = page.locator('#tablaDatos');
                const rows = table.locator('tbody tr');
                const rowCount = await rows.count();

                console.log(`Found ${rowCount} transactions`);

                // Extract table data
                const tableData = [];

                for (let i = 0; i < rowCount; i++) {
                    const row = rows.nth(i);
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

                        if (data[3] === 'Factura Electronica'){
                            data[3] = 'FACTURA'
                            data[4] = 'R-'+'F-'+data[1]+'-'+data[4]
                        } else if (data[3] === 'Factura Exenta Electronica'){
                            data[3] = 'FACTURA'
                            data[4] = 'R-'+'FX-'+data[1]+'-'+data[4]
                        } else if (data[3] === 'Factura de Compra Electronica'){
                            data[3] = 'FACTURA'
                            data[4] = 'R-'+'FC-'+data[1]+'-'+data[4]
                        } else if (data[3] === 'Nota de Debito Electronica'){
                            data[3] = 'NNDD'
                            data[4] = 'R-'+'ND-'+data[1]+'-'+data[4]
                        } else if (data[3] === 'Nota de Credito Electronica'){
                            data[3] = 'NNCC'
                            data[4] = 'R-'+'NC-'+data[1]+'-'+data[4]
                        } else if (data[3] === 'Guia de Despacho Electronica'){
                            data[3] = 'GGDD'
                            data[4] = 'R-'+'GD-'+data[1]+'-'+data[4]
                        } else if (data[3] === 'Boleta Electronica'){
                            data[3] = 'BOLETA'
                            data[4] = 'R-'+'BL-'+data[1]+'-'+data[4]
                        }

                        const realDate = new Date(Date.parse(data[5]))
                        const folioExists = await TransactionSchema.exists({externalID: data[4]});

                        if(project.startDate>realDate || realDate>project.endDate || folioExists){
                            continue
                        }

                        tableData.push({
                            receptor: data[1] || "",
                            razon_social: data[2] || "",
                            documento: data[3] || "",
                            folio: data[4] || "",
                            fecha: data[5] || "",
                            monto: data[6] || "",
                            estado: data[7] || "",
                            path: href,
                            oversea: oversea,
                        });
                    }

                //console.log('Extracted Data:', tableData);

                for (const entry of tableData) {
                    const link = await page.locator(`a[href="${entry.path}"]`);
                    await link.click({ button: 'middle' });
                    const newTab = await page.context().waitForEvent('page');
                    await newTab.waitForTimeout(1000);
                    await newTab.locator('xpath=//*[@id="headingOtros"]/h5/a').click();
                    const downloadButtonVisible = await newTab.isVisible('xpath=//*[@id="collapseOtros"]/div/div[8]/p/a[1]');
                    if(downloadButtonVisible){
                        await newTab.locator('xpath=//*[@id="collapseOtros"]/div/div[8]/p/a[1]').click({ button: 'middle' });
                        const downloadTab = await page.context().waitForEvent('page');
                        await downloadTab.close();
                        await newTab.close();
                    } else {
                        Boletas++
                        await newTab.close();
                    }
                }

                // Save data to MongoDB

                const transactions = tableData.map(entry => ({
                    type: entry.documento,
                    date: entry.fecha,
                    externalID: entry.folio,
                    lastSync: new Date(),
                    client: entry.emisor + " " + entry.razon_social,
                    description: "",
                    total: entry.monto,
                    status: entry.estado,
                    paymentStatus: "",
                    rawValue: "",
                    project: project._id,
                    path: "",
                    received: true,
                    oversea: entry.oversea,
                }));

                await TransactionSchema.insertMany(transactions);
                console.log(`Saved ${transactions.length} transactions to MongoDB`);

                // Click to go to the next page
                await page.waitForTimeout(5000);
                console.log(`Found ${Boletas} Boletas`);
                break;
            }
        }

    } catch (error) {
        console.error("Scraping error:", error);
    } finally {
        console.log("Closing the browser...");
        await browser.close();
    }
}

// Run the scraper
export {scrapeDocumentsReceived}