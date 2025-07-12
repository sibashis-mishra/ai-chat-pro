import { Collection, ObjectId } from 'mongodb';
import { dbConnection } from '../config/database.js';

export interface User {
  _id?: ObjectId;
  id: string;
  email: string;
  password: string;
  requestsUsed: number;
  requestsLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  requestsUsed?: number;
  requestsLimit?: number;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  requestsUsed?: number;
  requestsLimit?: number;
}

export class UserModel {
  private collection: Collection<User> | null = null;

  private getCollection(): Collection<User> {
    if (!this.collection) {
      const db = dbConnection.getDatabase();
      if (!db) {
        throw new Error('Database not connected');
      }
      this.collection = db.collection<User>('users');
    }
    return this.collection;
  }

  async create(userData: CreateUserData): Promise<User> {
    const user: User = {
      id: Date.now().toString(),
      email: userData.email,
      password: userData.password,
      requestsUsed: userData.requestsUsed || 0,
      requestsLimit: userData.requestsLimit || 10,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.getCollection().insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.getCollection().findOne({ email });
  }

  async findById(id: string): Promise<User | null> {
    return await this.getCollection().findOne({ id });
  }

  async findByObjectId(_id: ObjectId): Promise<User | null> {
    return await this.getCollection().findOne({ _id });
  }

  async update(id: string, updateData: UpdateUserData): Promise<boolean> {
    const result = await this.getCollection().updateOne(
      { id },
      { 
        $set: { 
          ...updateData,
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  async incrementRequests(id: string): Promise<boolean> {
    const result = await this.getCollection().updateOne(
      { id },
      { 
        $inc: { requestsUsed: 1 },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.getCollection().deleteOne({ id });
    return result.deletedCount > 0;
  }

  async count(): Promise<number> {
    return await this.getCollection().countDocuments();
  }

  async findAll(limit: number = 100, skip: number = 0): Promise<User[]> {
    return await this.getCollection()
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async createIndexes(): Promise<void> {
    await this.getCollection().createIndex({ email: 1 }, { unique: true });
    await this.getCollection().createIndex({ id: 1 }, { unique: true });
    await this.getCollection().createIndex({ createdAt: -1 });
  }
} 