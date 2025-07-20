import mongoose, { Schema, Document } from 'mongoose';
import Crypto from 'crypto';

const SECRET_KEY = 'secret key 123';

// AES-256 needs a 32-byte key
const key = Crypto.createHash('sha256').update(SECRET_KEY).digest();

function encrypt(text: string): string {
    const iv = Crypto.randomBytes(16);
    const cipher = Crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted;
}

// Subdocument Schemas
const BudgetSchema = new Schema({
    name: { type: String, required: true },
    isMain: { type: Boolean, default: false },
    amount: { type: Number, required: true },
});

const FamilySchema = new Schema({
    name: { type: String, required: true },
    budget: { type: Number, required: true },
    code: { type: String, required: true },
    selectable: { type: Boolean, default: true },
});

const WorkloadSchema = new Schema({
    name: { type: String, required: true },
    budget: { type: Number, required: true },
    family: { type: String, required: true },
});

const CredentialsSchema = new Schema({
    companyID: { type: String },
    companyPW: { type: String },
    representativeID: { type: String },
    representativePW: { type: String },
},{_id: false});


// Main Project Schema
const ProjectSchema = new Schema({
    name: { type: String, required: true },
    codename: { type: String, unique: true, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    organizationId: { type: String, required: true },
    apiKey: { type: String, required: true },
    apiKeyOC: { type: String, required: true },
    budgets: { type: [BudgetSchema], default: [] },
    families: { type: [FamilySchema], default: [] },
    workload: { type: [WorkloadSchema], default: [] },
    credentials: { type: CredentialsSchema, required: false },
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Pre-save hook to encrypt credentials fields
ProjectSchema.pre('save', function (next) {
    if (this.credentials) {
        const creds = this.credentials;
        for (const key of ['companyID', 'companyPW', 'representativeID', 'representativePW'] as const) {
            if (creds[key]) {
                if (!creds[key].includes(':')) {
                    try {
                        creds[key] = encrypt(creds[key]);
                    } catch (error) {
                        console.log(`Failed to encrypt ${key}:`, error);
                    }
                }
            }
        }
    }
    next();
});

// Define the Project model
export interface IProject extends Document {
    name: string;
    codename: string;
    startDate: Date;
    endDate: Date;
    organizationId: string;
    apiKey: string;
    apiKeyOC: string;
    budgets: Array<{
        name: string;
        isMain: boolean;
        amount: number;
    }>;
    families: Array<{
        name: string;
        budget: number;
        code: string;
    }>;
    workload: Array<{
        name: string;
        budget: number;
        family: string;
    }>;
    credentials: {
        companyID: string ;
        companyPW: string ;
        representativeID: string ;
        representativePW: string ;
    };
}

export default mongoose.model<IProject>('Project', ProjectSchema);
