import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
}

// User Schema
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, match: /^\S+@\S+\.\S+$/ }, // Email format validation
    password: { type: String, required: true },
    token: { type: String, default: '' }, // Optionally, can store a session or authentication token
    role: { type: String, default: UserRole.USER }, // Optionally, can store user role
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }], // Reference to Project model
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Hash the password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next(); // Skip if the password isn't modified
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare entered password with hashed password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Define the User model
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    token: string;
    role: UserRole;
    projects: mongoose.Types.ObjectId[]; // Array of Project ObjectIds
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export default mongoose.model<IUser>('User', UserSchema);
