import { Response, NextFunction } from 'express';
import {CustomRequest} from "../interfaces/interfaces";

// Check if the user has access to the project in the request query params
const projectAccess = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { project } = req.query;

    // Check if the user has access to the project in the request query params
    if (!project) {
        return res.status(400).json({ message: 'Project ID is required.' });
    }

    // Check if the user has access to the project
    if (!req.user.projects.includes(project)) {
        return res.status(403).json({ message: 'You do not have access to this project' });
    }

    next();
}

export default projectAccess;