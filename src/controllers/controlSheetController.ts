import { Request, Response } from 'express';
import ControlSheet from '../models/controlSheet.schema';

// Create ControlSheet
export const createControlSheet = async (req: Request, res: Response) => {
    const { name, budget, details} = req.body;

    try {
        // Create a new control sheet
        const controlSheet = await ControlSheet.create({
            name,
            budget,
            details,
        });

        res.status(201).json({ message: 'ControlSheet created successfully', controlSheet });
    } catch (error) {
        res.status(500).json({ message: 'Error creating control sheet', error });
    }
};

// Get All ControlSheets
export const getAllControlSheets = async (req: Request, res: Response) => {
    const { project } = req.query;
    try {
        // Fetch all control sheets from the database
        const controlSheets = await ControlSheet.find({ project });

        res.status(200).json({ message: 'ControlSheets retrieved successfully', controlSheets });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving control sheets', error });
    }
};

// Get ControlSheet by ID
export const getControlSheetById = async (req: Request, res: Response) => {
    const { controlSheetId } = req.params;

    try {
        // Fetch the control sheet by its ID
        const controlSheet = await ControlSheet.findById(controlSheetId);

        if (!controlSheet) {
            return res.status(404).json({ message: 'ControlSheet not found' });
        }

        res.status(200).json({ message: 'ControlSheet retrieved successfully', controlSheet });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving control sheet', error });
    }
};

// Update ControlSheet
export const updateControlSheet = async (req: Request, res: Response) => {
    const { controlSheetId } = req.params;
    const { name, budget, codes, agreements, observations } = req.body;

    try {
        // Find and update the control sheet
        const controlSheet = await ControlSheet.findById(controlSheetId);

        if (!controlSheet) {
            return res.status(404).json({ message: 'ControlSheet not found' });
        }

        // Update fields if provided
        if (name !== undefined) controlSheet.name = name;
        if (budget !== undefined) controlSheet.budget = budget;
        if (codes !== undefined) controlSheet.codes = codes;
        if (agreements !== undefined) controlSheet.agreements = agreements;
        if (observations !== undefined) controlSheet.observations = observations;

        await controlSheet.save();

        res.status(200).json({ message: 'ControlSheet updated successfully', controlSheet });
    } catch (error) {
        res.status(500).json({ message: 'Error updating control sheet', error });
    }
};

// Delete ControlSheet
export const deleteControlSheet = async (req: Request, res: Response) => {
    const { controlSheetId } = req.params;

    try {
        // Find and delete the control sheet
        const controlSheet = await ControlSheet.findByIdAndDelete(controlSheetId);

        if (!controlSheet) {
            return res.status(404).json({ message: 'ControlSheet not found' });
        }

        res.status(200).json({ message: 'ControlSheet deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting control sheet', error });
    }
};
