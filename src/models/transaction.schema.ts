import mongoose, { Schema, Document } from 'mongoose';

// Transaction Schema
const TransactionSchema = new Schema({
    type: {
        type: String,
        enum: ['OC', 'FACTURA', 'NNCC', 'EEPP'], // Restrict to specific values
        required: true,
    },
    date: { type: Date, required: true },
    externalID: { type: String, required: true, unique: true },
    lastSync: { type: Date, default: Date.now },
    client: { type: String, required: true },
    description: { type: String, default: '' },
    total: { type: Number, required: true },
    status: { type: String }, // Default value
    paymentStatus: { type: String }, // Default value
    rawValue: { type: Schema.Types.Mixed, required: false }, // Allows any object/dictionary
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    controlSheet: { type: Schema.Types.ObjectId, ref: 'ControlSheet', required: false },
    family: { type: String, required: false },
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Define the Transaction model
export interface ITransaction extends Document {
    type: 'OC' | 'FACTURA' | 'NNCC' | 'EEPP';
    date: Date;
    externalID: string;
    lastSync: Date;
    client: string;
    description: string;
    total: number;
    status: string;
    paymentStatus: string;
    rawValue: Record<string, any>; // Represents a dictionary
    project: string; // Refers to a Project by its ObjectId
    controlSheet: string; // Refers to a ControlSheet by its ObjectId
    family: string; // Matches project family names
}

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
