import mongoose from 'mongoose';
import { config } from './env.js';

/**
 * Connect to MongoDB database via Mongoose
 * Verifies MONGO_URI, registers connection lifecycle listeners,
 * and connects before the HTTP server starts.
 */
export const connectDB = async () => {
  const uri = config.mongoUri;

  if (!uri) {
    const errorMsg = 'CRITICAL: MONGO_URI is not defined in server/.env.';
    console.error(`❌ [Database Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (uri.includes('<username>') || uri.includes('<password>')) {
    const errorMsg =
      'CRITICAL: MONGO_URI in server/.env still contains placeholder values (<username> / <password>). Please supply valid MongoDB Atlas credentials.';
    console.error(`❌ [Database Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Register connection lifecycle event listeners
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connection established.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB connection disconnected.');
  });

  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of hanging
    });

    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ ===============================================');
    console.error('❌ MongoDB Connection Failed!');
    console.error(`❌ Error Message: ${error.message}`);
    console.error('❌ Check:');
    console.error('❌ 1. Is your MongoDB Atlas IP Access List set to 0.0.0.0/0 (or your IP)?');
    console.error('❌ 2. Are your username and password correct in server/.env?');
    console.error('❌ 3. Does the database user have read/write permissions?');
    console.error('❌ ===============================================');
    throw error;
  }
};
