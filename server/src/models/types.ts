import { Request } from 'express';
import type { User } from './User.js';

// Re-export types from models
export type { User } from './User.js';
export type { ChatMessage, TokenUsage } from './ChatMessage.js';

// Chat history item interface
export interface ChatHistoryItem {
  id: string;
  timestamp: Date;
  userMessage: string;
  aiResponse: string;
  systemPrompt?: string;
  chatMode: 'normal' | 'chain' | 'stream';
  model: string;
  tokens?: any;
  cost?: number;
  sessionId: string;
  userId?: string;
}

// Chat response interface
export interface ChatResponse {
  success: boolean;
  response: string;
  usage?: any;
  cost?: string;
  messageId?: string;
  isContinue?: boolean;
  type?: string;
}

// Extended Express Request with user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// AI Model interfaces
export interface AIModel {
  invoke(messages: any[]): Promise<any>;
  stream(messages: any[]): AsyncGenerator<any>;
  pipe(parser: any): any;
}

// Rate limit data interface
export interface RateLimitData {
  count: number;
  resetTime: number;
} 