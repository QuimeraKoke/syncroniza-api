import { Response, NextFunction } from 'express';
import User from '../models/user.models'; // Assuming your User model is in models/user.ts
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";
import {CustomRequest} from "../interfaces/interfaces";

const JWT_SECRET = 'your_jwt_secret'; // Ensure you use the same secret as in your login controller

// Middleware to check for JWT token in Authorization header or cookies
const authMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
    // Check for token in Authorization header
    const token = req.headers['authorization']?.split(' ')[1] || req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({message: 'Authentication required'});
    }

    try {
        // Verify the token
        const decoded : Map<string, string> = jwt.verify(token, JWT_SECRET);
        let user = await User.findById(new mongoose.Types.ObjectId(decoded["userId"] as string));
        if (!user) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        req.user = user; // Attach the user object to the request
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return res.status(401).json({message: 'Invalid or expired token'});
    }
};

export default authMiddleware;
