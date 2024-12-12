import { Request, Response } from 'express';
import Project from '../models/project.schema';
import Planification from '../models/planification.schema';  // Assuming you have a Planification model
import {  endOfDay, startOfDay, startOfWeek, isBefore, parseISO } from 'date-fns';
import {createWeeklyPlanifications, updateWeeklyPlanifications} from "../helpers/planification.helper";
import {CustomRequest} from "../interfaces/interfaces";


// Create Project - with planifications
export const createProject = async (req: Request, res: Response) => {
    const { name, codename, startDate, endDate, budgets, families, workload } = req.body;

    try {
        // Create the project document
        const project = await Project.create({
            name,
            codename,
            startDate: startOfDay(parseISO(startDate)),
            endDate: endOfDay(parseISO(endDate)),
            budgets,
            families,
            workload,
        });


        // Convert the startDate and endDate to Date objects
        const start = startOfWeek(parseISO(startDate), { weekStartsOn: 1 });
        const end = parseISO(endDate);

        // Create weekly planifications for the project
        await createWeeklyPlanifications(start, end, (project._id as string));

        res.status(201).json({ message: 'Project created successfully', project });
    } catch (error) {
        res.status(500).json({ message: 'Error creating project', error });
    }
};

// Get all projects
export const getAllProjects = async (req: CustomRequest, res: Response) => {
    try {
        const projects = await Project.find({ _id: { $in: req.user.projects } });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error });
    }
};

// Get a single project
export const getProject = async (req: CustomRequest, res: Response) => {
    const { projectId } = req.params;

    if ( req.user.projects.indexOf(projectId) === -1 ) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    try {

        if (req.user.projects.indexOf(projectId) === -1) {
            return res.status(403).json({ message: 'Unauthorized' });
        }


        const project = await Project.findById(projectId)
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project', error });
    }
};

// Update Project - also handles extending planifications if the endDate is changed
export const updateProject = async (req: CustomRequest, res: Response) => {
    const { projectId } = req.params;

    if ( req.user.projects.indexOf(projectId) === -1 ) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    const { name, codename, startDate, endDate, budgets, families, workload } = req.body;

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if the endDate is extended and create new planifications if necessary
        const oldEndDate = project.endDate;
        const newEndDate = parseISO(endDate);

        if (isBefore(oldEndDate, newEndDate)) {
            // Extend planifications if the new endDate is greater than the old one
            await updateWeeklyPlanifications(startDate, newEndDate, projectId);
        }

        // Update the project fields
        project.name = name;
        project.codename = codename;
        project.startDate = startDate;
        project.endDate = endDate;
        project.budgets = budgets;
        project.families = families;
        project.workload = workload;

        // Save the updated project
        await project.save();

        res.status(200).json({ message: 'Project updated successfully', project });
    } catch (error) {
        res.status(500).json({ message: 'Error updating project', error });
    }
};

// Delete Project
export const deleteProject = async (req: Request, res: Response) => {
    const { projectId } = req.params;

    try {
        const project = await Project.findByIdAndDelete(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Delete associated planifications (if any)
        await Planification.deleteMany({ project: projectId });

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project', error });
    }
};
