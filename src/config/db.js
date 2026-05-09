const mongoose = require('mongoose');
const env = require('./env');

let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    try {
        const conn = await mongoose.connect(env.MONGO_URI);
        cachedConnection = conn;
        console.log('MongoDB connected');
        return conn;
    } catch (error) {
        console.error(env.isProduction ? 'MongoDB connection failed' : `MongoDB connection failed: ${error.message}`);
        throw error;
    }
};

module.exports = connectDB;
