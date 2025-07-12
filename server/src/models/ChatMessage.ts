import { Collection, ObjectId } from 'mongodb';
import { dbConnection } from '../config/database.js';

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatMessage {
  _id?: ObjectId;
  id: string;
  timestamp: Date;
  userMessage: string;
  aiResponse: string;
  systemPrompt?: string;
  chatMode: 'normal' | 'chain' | 'stream';
  model: string;
  tokens?: TokenUsage;
  cost?: number;
  sessionId?: string;
  userId?: string;
  createdAt: Date;
}

export interface CreateChatMessageData {
  id: string;
  userMessage: string;
  aiResponse: string;
  systemPrompt?: string;
  chatMode: 'normal' | 'chain' | 'stream';
  model: string;
  tokens?: TokenUsage;
  cost?: number;
  sessionId?: string;
  userId?: string;
}

export interface ChatMessageFilter {
  userId?: string;
  sessionId?: string;
  chatMode?: 'normal' | 'chain' | 'stream';
  model?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ChatMessageStats {
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  averageTokensPerMessage: number;
  mostUsedChatMode: string;
  mostUsedModel: string;
}

export class ChatMessageModel {
  private collection: Collection<ChatMessage> | null = null;

  private getCollection(): Collection<ChatMessage> {
    if (!this.collection) {
      const db = dbConnection.getDatabase();
      if (!db) {
        throw new Error('Database not connected');
      }
      this.collection = db.collection<ChatMessage>('chat_messages');
    }
    return this.collection;
  }

  async create(messageData: CreateChatMessageData): Promise<ChatMessage> {
    const message: ChatMessage = {
      ...messageData,
      timestamp: new Date(),
      createdAt: new Date()
    };

    const result = await this.getCollection().insertOne(message);
    return { ...message, _id: result.insertedId };
  }

  async findById(id: string): Promise<ChatMessage | null> {
    return await this.getCollection().findOne({ id });
  }

  async findByUserId(userId: string, limit: number = 50, skip: number = 0): Promise<ChatMessage[]> {
    return await this.getCollection()
      .find({ userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async findBySessionId(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    return await this.getCollection()
      .find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  async findWithFilter(filter: ChatMessageFilter, limit: number = 50, skip: number = 0): Promise<ChatMessage[]> {
    const queryFilter: any = {};

    if (filter.userId) queryFilter.userId = filter.userId;
    if (filter.sessionId) queryFilter.sessionId = filter.sessionId;
    if (filter.chatMode) queryFilter.chatMode = filter.chatMode;
    if (filter.model) queryFilter.model = filter.model;
    
    if (filter.startDate || filter.endDate) {
      queryFilter.timestamp = {};
      if (filter.startDate) queryFilter.timestamp.$gte = filter.startDate;
      if (filter.endDate) queryFilter.timestamp.$lte = filter.endDate;
    }

    return await this.getCollection()
      .find(queryFilter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async getLastMessage(userId: string): Promise<ChatMessage | null> {
    return await this.getCollection().findOne(
      { userId },
      { sort: { timestamp: -1 } }
    );
  }

  async getLastAIMessage(userId: string): Promise<ChatMessage | null> {
    return await this.getCollection().findOne(
      { 
        userId,
        aiResponse: { $exists: true, $ne: '' }
      },
      { sort: { timestamp: -1 } }
    );
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.getCollection().deleteMany({ userId });
    return result.deletedCount;
  }

  async deleteBySessionId(sessionId: string): Promise<number> {
    const result = await this.getCollection().deleteMany({ sessionId });
    return result.deletedCount;
  }

  async count(filter?: ChatMessageFilter): Promise<number> {
    if (!filter) {
      return await this.getCollection().countDocuments();
    }

    const queryFilter: any = {};
    if (filter.userId) queryFilter.userId = filter.userId;
    if (filter.sessionId) queryFilter.sessionId = filter.sessionId;
    if (filter.chatMode) queryFilter.chatMode = filter.chatMode;
    if (filter.model) queryFilter.model = filter.model;

    return await this.getCollection().countDocuments(queryFilter);
  }

  async getStats(filter?: ChatMessageFilter): Promise<ChatMessageStats> {
    const queryFilter: any = {};
    if (filter?.userId) queryFilter.userId = filter.userId;
    if (filter?.sessionId) queryFilter.sessionId = filter.sessionId;
    if (filter?.chatMode) queryFilter.chatMode = filter.chatMode;
    if (filter?.model) queryFilter.model = filter.model;

    const pipeline = [
      { $match: queryFilter },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          totalTokens: { $sum: '$tokens.total_tokens' },
          totalCost: { $sum: '$cost' }
        }
      }
    ];

    const stats = await this.getCollection().aggregate(pipeline).toArray();
    const basicStats = stats[0] || { totalMessages: 0, totalTokens: 0, totalCost: 0 };

    // Get most used chat mode
    const chatModeStats = await this.getCollection().aggregate([
      { $match: queryFilter },
      { $group: { _id: '$chatMode', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]).toArray();

    // Get most used model
    const modelStats = await this.getCollection().aggregate([
      { $match: queryFilter },
      { $group: { _id: '$model', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]).toArray();

    return {
      totalMessages: basicStats.totalMessages,
      totalTokens: basicStats.totalTokens || 0,
      totalCost: basicStats.totalCost || 0,
      averageTokensPerMessage: basicStats.totalMessages > 0 
        ? Math.round((basicStats.totalTokens || 0) / basicStats.totalMessages) 
        : 0,
      mostUsedChatMode: chatModeStats[0]?._id || 'normal',
      mostUsedModel: modelStats[0]?._id || 'mock'
    };
  }

  async getCostBreakdown(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.getCollection().aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          totalCost: { $sum: '$cost' },
          totalTokens: { $sum: '$tokens.total_tokens' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: days }
    ]).toArray();
  }

  async getPopularSystemPrompts(limit: number = 10): Promise<Array<{ prompt: string; count: number }>> {
    const stats = await this.getCollection().aggregate([
      { $match: { systemPrompt: { $exists: true, $ne: null } } },
      { $group: { _id: '$systemPrompt', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]).toArray();

    return stats.map(stat => ({
      prompt: stat._id,
      count: stat.count
    }));
  }

  async createIndexes(): Promise<void> {
    await this.getCollection().createIndex({ id: 1 }, { unique: true });
    await this.getCollection().createIndex({ userId: 1 });
    await this.getCollection().createIndex({ sessionId: 1 });
    await this.getCollection().createIndex({ timestamp: -1 });
    await this.getCollection().createIndex({ chatMode: 1 });
    await this.getCollection().createIndex({ model: 1 });
    await this.getCollection().createIndex({ createdAt: -1 });
  }
} 