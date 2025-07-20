// Create mongoose conect to mongoDB

import mongoose from 'mongoose';

const MONGO_HOST = process.env.MONGO_HOST || 'localhost';
const MONGO_DATABASE = process.env.MONGO_DATABASE || 'syncroniza';
const MONGO_USER = process.env.MONGO_USER || 'root';
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || 'Passw0rd';


if (!MONGO_USER || !MONGO_PASSWORD) {
  throw new Error('MONGO_USER and MONGO_PASSWORD are required');
}

let MONGO_URI = '';

if (MONGO_HOST === 'localhost') {
    MONGO_URI = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:27018/${MONGO_DATABASE}`;
} else {
    MONGO_URI = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}/${MONGO_DATABASE}?retryWrites=true&w=majority`;
}

const connect = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB is connected');
    } catch (error) {
        console.error('MongoDB connection error', error);
    }
}

export default connect;




