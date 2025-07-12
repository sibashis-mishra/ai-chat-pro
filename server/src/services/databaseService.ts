import { dbConnection } from '../config/database.js';
import { UserModel, User, CreateUserData, UpdateUserData } from '../models/User.js';
import { 
  ChatMessageModel, 
  ChatMessage, 
  CreateChatMessageData, 
  ChatMessageFilter,
  ChatMessageStats,
  TokenUsage
} from '../models/ChatMessage.js';

export interface Analytics {
  totalConversations: number;
  totalTokens: number;
  totalCost: number;
  averageTokensPerResponse: number;
  mostUsedChatMode: string;
  popularSystemPrompts: Array<{ prompt: string; count: number }>;
}

export class DatabaseService {
  private userModel: UserModel;
  private chatMessageModel: ChatMessageModel;

  constructor() {
    this.userModel = new UserModel();
    this.chatMessageModel = new ChatMessageModel();
  }

  // Connection management
  async connect(): Promise<void> {
    await dbConnection.connect();
    await this.createIndexes();
  }

  async disconnect(): Promise<void> {
    await dbConnection.disconnect();
  }

  async healthCheck(): Promise<boolean> {
    return await dbConnection.healthCheck();
  }

  isConnected(): boolean {
    return dbConnection.isDatabaseConnected();
  }

  // Index creation
  private async createIndexes(): Promise<void> {
    try {
      await this.userModel.createIndexes();
      await this.chatMessageModel.createIndexes();
      console.log('✅ Database indexes created');
    } catch (error) {
      console.error('❌ Failed to create database indexes:', error);
    }
  }

  // User operations
  async createUser(userData: CreateUserData): Promise<User> {
    if (!this.isConnected()) {
      throw new Error('Database not connected');
    }
    return await this.userModel.create(userData);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    console.log('🔍 Looking for user by email:', email);
    if (!this.isConnected()) {
      console.log('❌ Database not connected in getUserByEmail');
      return null;
    }
    const user = await this.userModel.findByEmail(email);
    console.log('🔍 User found by email:', user ? `ID: ${user.id}` : 'Not found');
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.isConnected()) return null;
    return await this.userModel.findById(id);
  }

  async updateUser(id: string, updateData: UpdateUserData): Promise<boolean> {
    if (!this.isConnected()) return false;
    return await this.userModel.update(id, updateData);
  }

  async incrementUserRequests(userId: string): Promise<boolean> {
    if (!this.isConnected()) return false;
    return await this.userModel.incrementRequests(userId);
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!this.isConnected()) return false;
    return await this.userModel.delete(id);
  }

  async getAllUsers(limit: number = 100, skip: number = 0): Promise<User[]> {
    if (!this.isConnected()) return [];
    return await this.userModel.findAll(limit, skip);
  }

  async getUserCount(): Promise<number> {
    if (!this.isConnected()) return 0;
    return await this.userModel.count();
  }

  // Chat message operations
  async saveChatMessage(messageData: CreateChatMessageData): Promise<ChatMessage> {
    if (!this.isConnected()) {
      throw new Error('Database not connected');
    }
    return await this.chatMessageModel.create(messageData);
  }

  async getChatMessageById(id: string): Promise<ChatMessage | null> {
    if (!this.isConnected()) return null;
    return await this.chatMessageModel.findById(id);
  }

  async getChatHistory(limit: number = 50, sessionId?: string, userId?: string): Promise<ChatMessage[]> {
    if (!this.isConnected()) return [];

    if (sessionId) {
      return await this.chatMessageModel.findBySessionId(sessionId, limit);
    }

    if (userId) {
      return await this.chatMessageModel.findByUserId(userId, limit);
    }

    // If no filters, return recent messages
    return await this.chatMessageModel.findWithFilter({}, limit);
  }

  async getChatHistoryWithFilter(filter: ChatMessageFilter, limit: number = 50, skip: number = 0): Promise<ChatMessage[]> {
    if (!this.isConnected()) return [];
    return await this.chatMessageModel.findWithFilter(filter, limit, skip);
  }

  async getLastChatMessage(userId: string): Promise<ChatMessage | null> {
    if (!this.isConnected()) return null;
    return await this.chatMessageModel.getLastMessage(userId);
  }

  async getLastAIMessage(userId: string): Promise<ChatMessage | null> {
    if (!this.isConnected()) return null;
    return await this.chatMessageModel.getLastAIMessage(userId);
  }

  async deleteChatHistoryByUserId(userId: string): Promise<number> {
    if (!this.isConnected()) return 0;
    return await this.chatMessageModel.deleteByUserId(userId);
  }

  async deleteChatHistoryBySessionId(sessionId: string): Promise<number> {
    if (!this.isConnected()) return 0;
    return await this.chatMessageModel.deleteBySessionId(sessionId);
  }

  async getChatMessageCount(filter?: ChatMessageFilter): Promise<number> {
    if (!this.isConnected()) return 0;
    return await this.chatMessageModel.count(filter);
  }

  // Analytics operations
  async getAnalytics(): Promise<Analytics> {
    if (!this.isConnected()) {
      return {
        totalConversations: 0,
        totalTokens: 0,
        totalCost: 0,
        averageTokensPerResponse: 0,
        mostUsedChatMode: 'normal',
        popularSystemPrompts: []
      };
    }

    try {
      const stats = await this.chatMessageModel.getStats();
      const popularSystemPrompts = await this.chatMessageModel.getPopularSystemPrompts();

      return {
        totalConversations: stats.totalMessages,
        totalTokens: stats.totalTokens,
        totalCost: stats.totalCost,
        averageTokensPerResponse: stats.averageTokensPerMessage,
        mostUsedChatMode: stats.mostUsedChatMode,
        popularSystemPrompts
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        totalConversations: 0,
        totalTokens: 0,
        totalCost: 0,
        averageTokensPerResponse: 0,
        mostUsedChatMode: 'normal',
        popularSystemPrompts: []
      };
    }
  }

  async getAnalyticsForUser(userId: string): Promise<Analytics> {
    if (!this.isConnected()) {
      return {
        totalConversations: 0,
        totalTokens: 0,
        totalCost: 0,
        averageTokensPerResponse: 0,
        mostUsedChatMode: 'normal',
        popularSystemPrompts: []
      };
    }

    try {
      const filter: ChatMessageFilter = { userId };
      const stats = await this.chatMessageModel.getStats(filter);
      const popularSystemPrompts = await this.chatMessageModel.getPopularSystemPrompts();

      return {
        totalConversations: stats.totalMessages,
        totalTokens: stats.totalTokens,
        totalCost: stats.totalCost,
        averageTokensPerResponse: stats.averageTokensPerMessage,
        mostUsedChatMode: stats.mostUsedChatMode,
        popularSystemPrompts
      };
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      return {
        totalConversations: 0,
        totalTokens: 0,
        totalCost: 0,
        averageTokensPerResponse: 0,
        mostUsedChatMode: 'normal',
        popularSystemPrompts: []
      };
    }
  }

  async getCostBreakdown(days: number = 30): Promise<any[]> {
    if (!this.isConnected()) return [];
    return await this.chatMessageModel.getCostBreakdown(days);
  }

  async getChatMessageStats(filter?: ChatMessageFilter): Promise<ChatMessageStats> {
    if (!this.isConnected()) {
      return {
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        averageTokensPerMessage: 0,
        mostUsedChatMode: 'normal',
        mostUsedModel: 'mock'
      };
    }
    return await this.chatMessageModel.getStats(filter);
  }

  // Utility methods
  async getDatabaseInfo(): Promise<{
    isConnected: boolean;
    userCount: number;
    messageCount: number;
    databaseName: string;
  }> {
    const isConnected = this.isConnected();
    const userCount = isConnected ? await this.getUserCount() : 0;
    const messageCount = isConnected ? await this.getChatMessageCount() : 0;

    return {
      isConnected,
      userCount,
      messageCount,
      databaseName: process.env.MONGODB_DATABASE || 'ai-chat-pro'
    };
  }
}

// Export singleton instance
export const dbService = new DatabaseService();

// Export types for backward compatibility
export type { User, ChatMessage, TokenUsage }; 