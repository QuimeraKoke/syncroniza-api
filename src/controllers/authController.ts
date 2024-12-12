import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import nodemailer from 'nodemailer'; // For sending password recovery email
import crypto from 'crypto'; // For generating recovery token

import User from '../models/user.models'; // Assuming your User model is in models/user.ts

const JWT_SECRET = 'your_jwt_secret'; // Replace with an actual secret, ideally stored in env variables

// Register new user
export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create and save new user
        const newUser = new User({
            name,
            email,
            password,
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully'});
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Login user
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate a JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '8h' });

        res.cookie('auth_token', token, {
            httpOnly: true, // Ensures the cookie can't be accessed via JavaScript
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (requires HTTPS)
            maxAge: 3600000 * 12, // Token expiration (1 hour in milliseconds)
            sameSite: 'strict', // Restricts cross-site cookie usage
        });

        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Recover password (send recovery email with a link)
export const recoverPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Generate a recovery token
        const recoveryToken = crypto.randomBytes(20).toString('hex');

        // Save the recovery token to the user (you can store it with an expiration date if needed)
        user.token = recoveryToken;
        await user.save();

        // Send recovery email
        // const transporter = nodemailer.createTransport({
        //     service: 'gmail', // Or your email service
        //     auth: {
        //         user: 'your_email@example.com', // Your email
        //         pass: 'your_email_password', // Your email password or app-specific password
        //     },
        // });
        //
        // const mailOptions = {
        //     from: 'your_email@example.com',
        //     to: user.email,
        //     subject: 'Password Recovery',
        //     text: `Click the link to reset your password: http://localhost:3000/reset-password/${recoveryToken}`,
        // };
        //
        // await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Recovery email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    try {
        // Find user by recovery token
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid recovery token' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        user.token = ''; // Clear the recovery token
        await user.save();

        res.status(200).json({ message: 'Password successfully reset' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
