import mongoose, { Schema, Document } from 'mongoose';

export interface IBuilding extends Document {
    name: string;
    project: mongoose.Types.ObjectId; // Reference to Project
    floors: {
        floorNumber: number;
        spaces: {
            spaceType: mongoose.Types.ObjectId; // Reference to SpaceType
            count: number; // Number of spaces of this type
        }[];
    }[];
}

const BuildingSchema = new Schema({
    name: { type: String, required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true }, // Reference to Project
    floors: [
        {
            floorNumber: { type: Number, required: true },
            spaces: [
                {
                    spaceType: { type: Schema.Types.ObjectId, ref: 'SpaceType', required: true },
                    count: { type: Number, required: true },
                },
            ],
        },
    ],
});

export default mongoose.model<IBuilding>('Building', BuildingSchema);