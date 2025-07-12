export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'normal' | 'chain' | 'stream';
  isContinue?: boolean;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  cost?: string;
  tokensUsed?: number;
  error?: string;
}

export interface UsageResponse {
  success: boolean;
  usage: {
    requestsUsed: number;
    requestsLimit: number;
    remainingRequests: number;
    usagePercentage: number;
  };
}

export interface ChatHistoryItem {
  id: string;
  userMessage: string;
  aiResponse: string;
  systemPrompt?: string;
  chatMode: 'normal' | 'chain' | 'stream';
  timestamp: string;
  cost?: number;
  model?: string;
  tokens?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface User {
  id: string;
  email: string;
  requestsUsed: number;
  requestsLimit: number;
} 