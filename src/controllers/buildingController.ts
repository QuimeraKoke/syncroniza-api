import { Request, Response } from 'express';
import SpaceType from '../models/spaceType.schema'
import mongoose from "mongoose";

export const createSpaceType = async (req: Request, res: Response) => {
    const {name, area } = req.body;
    const {project} = req.query;
    try {
        const spaceType = await SpaceType.create({
            name, area, project: new mongoose.Types.ObjectId(project.toString())
        })
        res.status(201).json({ message: 'Space Type created successfully', spaceType });
    } catch (error) {
        res.status(500).json({message: "Error creating space type"})
    }
}