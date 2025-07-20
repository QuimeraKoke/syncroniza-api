import mongoose, { Schema, Document } from 'mongoose';

export interface ISpaceType extends Document {
    name: string;
    area: number; // Area in square meters
    project: mongoose.Types.ObjectId; // Reference to Project
}

const SpaceTypeSchema = new Schema({
    name: { type: String, required: true, unique: true },
    area: { type: Number, required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true }, // Reference to Project
});

export default mongoose.model<ISpaceType>('SpaceType', SpaceTypeSchema);
