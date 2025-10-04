// @/config/db.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not set');
}

let cached = global.mongoose || (global.mongoose = { conn: null, promise: null });

async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            connectTimeoutMS: 30000,
            serverSelectionTimeoutMS: 15000, // Increased for Vercel
            socketTimeoutMS: 45000,
            maxPoolSize: 5, // Smaller pool for stability
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then(mongoose => {
            console.log("MongoDB connected");
            // Register models
            require('@/models/Address');
            require('@/models/Order');
            require('@/models/Product');
            return mongoose;
        }).catch(e => {
            console.error("MongoDB connection failed:", e.message);
            throw e;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default connectDB;