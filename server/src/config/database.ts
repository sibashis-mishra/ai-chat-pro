import { MongoClient, Db } from 'mongodb';
import { config } from './environment.js';

export interface DatabaseConfig {
  uri: string;
  databaseName: string;
  options: {
    maxPoolSize: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    connectTimeoutMS: number;
  };
}

export const databaseConfig: DatabaseConfig = {
  uri: config.MONGODB_URI,
  databaseName: config.MONGODB_DATABASE,
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  }
};

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    if (!databaseConfig.uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    try {
      this.client = new MongoClient(databaseConfig.uri, databaseConfig.options);
      await this.client.connect();
      this.db = this.client.db(databaseConfig.databaseName);
      this.isConnected = true;
      
      console.log(`✅ Connected to MongoDB: ${databaseConfig.databaseName}`);
      
      // Test the connection
      await this.db.admin().ping();
      console.log('✅ Database ping successful');
      
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      console.log('Set MONGODB_URI environment variable to enable database features');
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  getDatabase(): Db | null {
    return this.db;
  }

  isDatabaseConnected(): boolean {
    return this.isConnected && this.db !== null;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isConnected || !this.db) {
      return false;
    }

    try {
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

export const dbConnection = DatabaseConnection.getInstance(); 