import mongoose, { Schema, Document } from 'mongoose';

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
});

const WorkloadSchema = new Schema({
    name: { type: String, required: true },
    budget: { type: Number, required: true },
    family: { type: String, required: true },
});

// Main Project Schema
const ProjectSchema = new Schema({
    name: { type: String, required: true },
    codename: { type: String, unique: true, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    organizationId: { type: String, required: true },
    budgets: { type: [BudgetSchema], default: [] },
    families: { type: [FamilySchema], default: [] },
    workload: { type: [WorkloadSchema], default: [] },
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Define the Project model
export interface IProject extends Document {
    name: string;
    codename: string;
    startDate: Date;
    endDate: Date;
    organizationId: string;
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
}

export default mongoose.model<IProject>('Project', ProjectSchema);
