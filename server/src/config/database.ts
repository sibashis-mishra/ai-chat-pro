import { MongoClient, Db, W } from 'mongodb';
import { config } from './environment.js';

export interface DatabaseConfig {
  uri: string;
  databaseName: string;
  options: {
    maxPoolSize: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    connectTimeoutMS: number;
    maxIdleTimeMS?: number;
    retryWrites?: boolean;
    retryReads?: boolean;
    w?: W;
    directConnection?: boolean;
    ssl?: boolean;
    tls?: boolean;
    tlsAllowInvalidCertificates?: boolean;
    tlsAllowInvalidHostnames?: boolean;
    minPoolSize?: number;
    maxConnecting?: number;
    compressors?: ("zlib" | "none" | "snappy" | "zstd")[];
    zlibCompressionLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  };
}

// Helper function to ensure MongoDB URI is properly formatted
function ensureMongoDBUri(uri: string): string {
  if (!uri) return uri;
  
  // If URI doesn't have retryWrites and w parameters, add them
  if (!uri.includes('retryWrites=')) {
    uri += uri.includes('?') ? '&' : '?';
    uri += 'retryWrites=true';
  }
  
  if (!uri.includes('w=')) {
    uri += '&w=majority';
  }
  
  // Add additional parameters for better serverless compatibility
  if (!uri.includes('maxPoolSize=')) {
    uri += '&maxPoolSize=10';
  }
  
  if (!uri.includes('serverSelectionTimeoutMS=')) {
    uri += '&serverSelectionTimeoutMS=30000';
  }
  
  if (!uri.includes('connectTimeoutMS=')) {
    uri += '&connectTimeoutMS=30000';
  }
  
  if (!uri.includes('socketTimeoutMS=')) {
    uri += '&socketTimeoutMS=45000';
  }
  
  console.log('🔧 Final MongoDB URI (sanitized):', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  return uri;
}

export const databaseConfig: DatabaseConfig = {
  uri: ensureMongoDBUri(config.MONGODB_URI),
  databaseName: config.MONGODB_DATABASE,
  options: {
    maxPoolSize: 5, // Reduced for serverless environments
    serverSelectionTimeoutMS: 30000, // Increased from 5000ms to 30000ms for serverless
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000, // Increased from 10000ms to 30000ms for serverless
    // Additional options for better serverless compatibility
    maxIdleTimeMS: 30000,
    retryWrites: true,
    retryReads: true,
    w: 'majority',
    // Atlas-specific options
    directConnection: false,
    ssl: true,
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    // Serverless-specific optimizations
    minPoolSize: 0, // Start with no connections
    maxConnecting: 2, // Limit concurrent connection attempts
    compressors: ['zlib'], // Enable compression
    zlibCompressionLevel: 6
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
    console.log('🔍 Connecting to MongoDB:', databaseConfig.uri);
    if (this.isConnected && this.client) {
      return;
    }

    if (!databaseConfig.uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Connection attempt ${attempt}/${maxRetries}`);
        
        this.client = new MongoClient(databaseConfig.uri, databaseConfig.options);
        
        // Add connection event listeners for better debugging
        this.client.on('connected', () => {
          console.log('✅ MongoDB client connected');
        });
        
        this.client.on('error', (error) => {
          console.error('❌ MongoDB client error:', error);
        });
        
        this.client.on('close', () => {
          console.log('🔌 MongoDB client closed');
          this.isConnected = false;
        });
        
        await this.client.connect();
        this.db = this.client.db(databaseConfig.databaseName);
        this.isConnected = true;
        
        console.log(`✅ Connected to MongoDB: ${databaseConfig.databaseName}`);
        
        // Test the connection
        await this.db.admin().ping();
        console.log('✅ Database ping successful');
        return; // Success, exit the retry loop
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ MongoDB connection attempt ${attempt} failed:`, error);
        
        // Clean up failed connection
        if (this.client) {
          try {
            await this.client.close();
          } catch (closeError) {
            console.error('Error closing failed connection:', closeError);
          }
          this.client = null;
          this.db = null;
          this.isConnected = false;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // All retries failed
    console.error('❌ All MongoDB connection attempts failed');
    console.log('Set MONGODB_URI environment variable to enable database features');
    this.isConnected = false;
    throw lastError || new Error('Failed to connect to MongoDB after multiple attempts');
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