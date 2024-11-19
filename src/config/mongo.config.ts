// Create mongoose conect to mongoDB

import mongoose from 'mongoose';

const MONGO_HOST = process.env.MONGO_HOST || 'localhost';
const MONGO_DATABASE = process.env.MONGO_DATABASE || 'test';
const MONGO_USER = process.env.MONGO_USER
const MONGO_PASSWORD = process.env.MONGO_PASSWORD


if (!MONGO_USER || !MONGO_PASSWORD) {
  throw new Error('MONGO_USER and MONGO_PASSWORD are required');
}

let MONGO_URI = '';

if (MONGO_HOST === 'localhost') {
    MONGO_URI = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}/${MONGO_DATABASE}`;
} else {
    MONGO_URI = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}/${MONGO_DATABASE}?retryWrites=true&w=majority`;
}

const connect = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
        });
        console.log('MongoDB is connected');
    } catch (error) {
        console.error('MongoDB connection error', error);
    }
}

export default connect;




