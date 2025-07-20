import mongoose, { Schema, Document } from 'mongoose';

// Transaction Schema
const TransactionSchema = new Schema({
    type: {
        type: String,
        enum: ['OC', 'FACTURA', 'NNCC','NNDD', 'EEPP', 'BOLETA','GGDD'],  // Restrict to specific values
        required: true,
    },
    date: { type: Date, required: true },
    externalID: { type: String, required: true, unique: true }, //folio
    lastSync: { type: Date, default: Date.now }, //cuando lo traje
    client: { type: String, required: true }, //rut y nombre
    description: { type: String, default: '' }, //glosa del pdf
    total: { type: Number, required: true }, //monto total
    status: { type: String }, // Default value, estado de documentos
    paymentStatus: { type: String }, // Default value
    rawValue: { type: Schema.Types.Mixed, required: false }, // Allows any object/dictionary agrgar un objeto con bruto retncion y liquido pero solo boletas
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true }, //poner algo
    controlSheet: { type: Schema.Types.ObjectId, ref: 'ControlSheet', required: false },
    family: { type: String, required: false },
    path: {type: String, required: false}, //descarga pdf
    received: {type: Boolean, default: false}, //Saber si es emitido o recibido
    oversea: {type: Boolean, default: false} //saber si es producto extrangero o no
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Define the Transaction model
export interface ITransaction extends Document {
    type: 'OC' | 'FACTURA' | 'NNCC' | 'EEPP'|'NNDD'|'BOLETA'|'GGDD';
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
    received: boolean;
}

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);


