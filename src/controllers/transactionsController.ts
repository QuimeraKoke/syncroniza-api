import { Request, Response } from 'express';
import Transaction from '../models/transaction.schema';
import Project from '../models/project.schema';

export const createTransaction = async (req: Request, res: Response) => {
    const {
        type,
        date,
        externalID,
        client,
        description,
        total,
        status,
        paymentStatus,
        rawValue,
        project,
        controlSheet,
        family,
    } = req.body;

    try {
        // Validation: Check if the family exists in the project
        if (project && family) {
            const projectData = await Project.findById(project);
            const validFamilies = projectData?.families.map((f) => f.name);
            if (!validFamilies?.includes(family)) {
                return res.status(400).json({ message: 'Invalid family name for the specified project' });
            }
        }

        const transaction = await Transaction.create({
            type,
            date,
            externalID,
            client,
            description,
            total,
            status,
            paymentStatus,
            rawValue,
            project,
            controlSheet,
            family,
        });

        res.status(201).json({ message: 'Transaction created successfully', transaction });
    } catch (error) {
        res.status(500).json({ message: 'Error creating transaction', error });
    }
};

export const getAllTransactions = async (req: Request, res: Response) => {
    const { project, controlSheetId } = req.query;

    try {
        const query: any = {};
        if (project) query.project = project;
        if (controlSheetId) query.controlSheet = controlSheetId;

        const transactions = await Transaction.find(query)
            .populate('project', 'name')
            .populate('controlSheet', 'name');

        res.status(200).json({ message: 'Transactions retrieved successfully', transactions });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving transactions', error });
    }
};

export const getTransactionById = async (req: Request, res: Response) => {
    const { transactionId } = req.params;

    try {
        const transaction = await Transaction.findById(transactionId)
            .populate('project', 'name')
            .populate('controlSheet', 'name');

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.status(200).json({ message: 'Transaction retrieved successfully', transaction });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving transaction', error });
    }
};

export const updateTransaction = async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    const updateData = req.body;

    try {
        // Validate updated family if provided
        if (updateData.project && updateData.family) {
            const projectData = await Project.findById(updateData.project);
            const validFamilies = projectData?.families.map((f) => f.name);
            if (!validFamilies?.includes(updateData.family)) {
                return res.status(400).json({ message: 'Invalid family name for the specified project' });
            }
        }

        const transaction = await Transaction.findByIdAndUpdate(transactionId, updateData, { new: true });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.status(200).json({ message: 'Transaction updated successfully', transaction });
    } catch (error) {
        res.status(500).json({ message: 'Error updating transaction', error });
    }
};

export const deleteTransaction = async (req: Request, res: Response) => {
    const { transactionId } = req.params;

    try {
        const transaction = await Transaction.findByIdAndDelete(transactionId);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting transaction', error });
    }
};

