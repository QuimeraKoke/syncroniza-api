import { Request, Response } from 'express';
import Planification from '../models/planification.schema';
import {endOfWeek, parseISO, startOfWeek} from "date-fns";
import {CustomRequest} from "../interfaces/interfaces";


// Get All Planifications by Project
export const getAllPlanifications = async (req: Request, res: Response) => {
    const { project } = req.query;

    try {
        // Validate the projectId

        // Fetch planifications filtered by projectId
        const planifications = await Planification.find({ project: project });

        res.status(200).json({ message: 'Planifications retrieved successfully', planifications });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving planifications', error });
    }
};


// Get Planification by ID
export const getPlanificationById = async (req: Request, res: Response) => {
    const { planificationId } = req.params;

    try {
        // Fetch the planification by its ID
        const planification = await Planification.findById(planificationId);

        if (!planification) {
            return res.status(404).json({ message: 'Planification not found' });
        }

        res.status(200).json({ message: 'Planification retrieved successfully', planification });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving planification', error });
    }
};

// Create Planification Week
export const createPlanification = async (req: CustomRequest, res: Response) => {
    let { project, startDate, endDate, planifiedEarnValue, planifiedEarnValuePercentage, earnValue } = req.body;

    try {
        // Validate required fields
        if (!project || !startDate || !endDate) {
            return res.status(400).json({ message: 'Project, startDate, and endDate are required.' });
        }

        if (req.user.projects.indexOf(project) === -1) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Convert the startDate and endDate to Date objects
        startDate = startOfWeek(parseISO(startDate), { weekStartsOn: 1 });
        endDate = endOfWeek(parseISO(endDate), { weekStartsOn: 1 });

        // Check if the planification already exists for the same week
        const existingPlanification = await Planification.findOne({
            project,
            startDate,
            endDate,
        });

        if (existingPlanification) {
            return res.status(400).json({ message: 'A planification already exists for the specified week.' });
        }

        // Create new planification
        const planification = await Planification.create({
            project,
            startDate,
            endDate,
            planifiedEarnValue: planifiedEarnValue || 0, // Default to 0 if not provided
            planifiedEarnValuePercentage: planifiedEarnValuePercentage || 0,
            earnValue: earnValue || 0,
        });

        res.status(201).json({ message: 'Planification created successfully', planification });
    } catch (error) {
        res.status(500).json({ message: 'Error creating planification', error });
    }
};

// Update Planification Week
export const updatePlanification = async (req: CustomRequest, res: Response) => {
    const { planificationId } = req.params;
    const { planifiedEarnValue, planifiedEarnValuePercentage, earnValue, workloadValues } = req.body;

    try {
        // Find the planification by ID
        const planification = await Planification.findById(planificationId);

        if (!planification) {
            return res.status(404).json({ message: 'Planification not found' });
        }

        if (req.user.projects.indexOf(planification.project) === -1) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Update the fields
        if (planifiedEarnValue !== undefined) {
            planification.planifiedEarnValue = planifiedEarnValue;
        }
        if (planifiedEarnValuePercentage !== undefined) {
            planification.planifiedEarnValuePercentage = planifiedEarnValuePercentage;
        }
        if (earnValue !== undefined) {
            planification.earnValue = earnValue;
        }

        if (workloadValues !== undefined) {
            planification.workloadValues = workloadValues;
        }

        // Save the updated planification
        await planification.save();

        res.status(200).json({ message: 'Planification updated successfully', planification });
    } catch (error) {
        res.status(500).json({ message: 'Error updating planification', error });
    }
};
