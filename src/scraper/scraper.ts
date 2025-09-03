import projectSchema from "../models/project.schema";
import connect from '../config/mongo.config';
import Crypto from 'crypto';
import { scrapeBallotsIssued } from "./boletas_emitidas";
import { scrapeBallotsReceived } from "./boletas_recibidas";
import { scrapeDocumentsIssued } from "./scraper_emitidos";
import { scrapeDocumentsReceived } from "./scraper_recibidos";

const SECRET_KEY = 'secret key 123';
const key = Crypto.createHash('sha256').update(SECRET_KEY).digest();

function decrypt(encrypted: string): string {
    const [ivBase64, encryptedData] = encrypted.split(':');
    if (!ivBase64 || !encryptedData) {
        throw new Error('Invalid encrypted data format');
    }
    const iv = Buffer.from(ivBase64, 'base64');
    const decipher = Crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

  // Post-find hook to decrypt credentials fields
function decryptCredentials(doc: any) {
    if (!doc?.credentials) return doc;

    const creds = doc.credentials;
    for (const key of ['companyID', 'companyPW', 'representativeID', 'representativePW'] as const) {
        if (creds[key]) {
            try {
                creds[key] = decrypt(creds[key]);
            } catch (error) {
                console.log(`Failed to decrypt ${key}:`, error);
            }
        }
    }
    return doc
}

async function scrapear (){
    await connect();
    const projects = await projectSchema.find({credentials: {$ne: null}});
    for(let project of projects){
        const decryptProject = decryptCredentials(project)
        if (!decryptProject.credentials) {
            console.log(`No credentials found for project: ${decryptProject.name}`);
            continue;
        }
        let personalCredentials: boolean = decryptProject.credentials.representativeID && decryptProject.credentials.representativePW;
        let companyCredentials: boolean = decryptProject.credentials.companyID && decryptProject.credentials.companyPW;
        
        if (personalCredentials) {
            console.log("Scrapping personal documents for project:", decryptProject.name);
            await scrapeDocumentsIssued(decryptProject);
            await scrapeDocumentsReceived(decryptProject);
        } else {
            console.log("Skipping personal documents for project:", decryptProject.name);
        }

        if (companyCredentials || (decryptProject.credentials.crossCredential && personalCredentials)) {
            console.log("Scrapping company documents for project:", decryptProject.name);
            await scrapeDocumentsIssued(decryptProject, false);
            await scrapeDocumentsReceived(decryptProject, false);
        } else {
            console.log(`Missing company credentials for project: ${decryptProject.name}`);
        }
    }
}
scrapear().then(r => {
    console.log("Scraping completed successfully");
    process.exit(0);
});




