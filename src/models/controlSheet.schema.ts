import mongoose, { Schema, Document } from 'mongoose';

// Subdocument Schemas
const codeDetailSchema = new Schema({
    family: { type: String, required: true },
    code: { type: [String], default: [] }, // Array of strings
});

const AgreementSchema = new Schema({
    name: { type: String, required: true },
    family: { type: String, required: true }, // Related to project families by name
    description: { type: String, required: true },
    amount: { type: Number, required: true },
});

const ObservationSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    realAmount: { type: Number, required: true },
    recoverAmount: { type: Number, required: true },
    observation: { type: String, required: true },
    family: { type: String, required: true }, // Related to project families by name
});

// Main ControlSheet Schema
const ControlSheetSchema = new Schema({
    name: { type: String, required: true },
    budget: { type: Number, required: true },
    codes: { type: [codeDetailSchema], default: [] },
    agreements: { type: [AgreementSchema], default: [] },
    observations: { type: [ObservationSchema], default: [] },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Define the ControlSheet model
export interface IControlSheet extends Document {
    name: string;
    budget: number;
    codes: Array<{
        family: string;
        code: string;
    }>
    agreements: Array<{
        name: string;
        family: string; // Matches project family names
        description: string;
        amount: number;
    }>;
    observations: Array<{
        name: string;
        description: string;
        realAmount: number;
        recoverAmount: number;
        observation: string;
        family: string; // Matches project family names
    }>;
    project: string; // Refers to a Project by its ObjectId
}

export default mongoose.model<IControlSheet>('ControlSheet', ControlSheetSchema);
