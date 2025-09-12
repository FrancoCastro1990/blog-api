import mongoose from 'mongoose';
import { config } from '../../config';

/**
 * MongoDB connection handler
 * Manages the database connection lifecycle
 */
export class MongooseConnection {
  private static instance: MongooseConnection;
  private isConnected = false;

  private constructor() {}

  /**
   * Singleton pattern to ensure single database connection
   */
  public static getInstance(): MongooseConnection {
    if (!MongooseConnection.instance) {
      MongooseConnection.instance = new MongooseConnection();
    }
    return MongooseConnection.instance;
  }

  /**
   * Establishes connection to MongoDB
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Already connected to MongoDB');
      return;
    }

    try {
      await mongoose.connect(config.mongoUri);
      this.isConnected = true;
      console.log('Connected to MongoDB successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Closes the database connection
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Returns the connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

/**
 * Export singleton instance
 */
export const mongooseConnection = MongooseConnection.getInstance();