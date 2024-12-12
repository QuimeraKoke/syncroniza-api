import mongoose, { Schema, Document } from 'mongoose';

const workloadValueSchema = new Schema({
    name: { type: String, required: true }, // From project workload name
    value: { type: Number, required: true },
});

// Planification Schema
const PlanificationSchema = new Schema({
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    planifiedEarnValue: { type: Number, required: true },
    planifiedEarnValuePercentage: { type: Number, required: true },
    earnValue: { type: Number, required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    workloadValues: { type: [workloadValueSchema], default: [] },
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Define the Planification model
export interface IPlanification extends Document {
    startDate: Date;
    endDate: Date;
    planifiedEarnValue: number;
    planifiedEarnValuePercentage: number;
    earnValue: number;
    project: string; // Refers to a Project by its ObjectId
    workloadValues: Array<{
        name: string;
        value: number;
    }>;
}

export default mongoose.model<IPlanification>('Planification', PlanificationSchema);
