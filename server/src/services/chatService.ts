import { ChatMessage, ChatResponse } from '../models/types.js';
import { dbService } from './databaseService.js';
import aiService from './aiService.js';
import costTracking from '../utils/costTracking.js';

export class ChatService {
  async processNormalChat(
    message: string, 
    systemPrompt: string, 
    sessionId: string, 
    userId?: string,
    isContinueRequest?: boolean
  ): Promise<ChatResponse> {
    const messages = aiService.createMessages(
      isContinueRequest ? 'continue' : message, 
      systemPrompt
    );
    
    const response = await aiService.invoke(messages);
    const result = typeof response === 'string' ? response : response.content;
    
    // Track costs
    const cost = response.response_metadata?.usage ? 
      costTracking.calculateCost(response.response_metadata.usage.total_tokens || 0) : 0;
    
    if (response.response_metadata?.usage) {
      const usage = response.response_metadata.usage;
      costTracking.addUsage(usage.total_tokens || 0, cost);
    }
    
    // Save to database
    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      timestamp: new Date(),
      userMessage: isContinueRequest ? 'continue' : message,
      aiResponse: result,
      systemPrompt,
      chatMode: 'normal',
      model: 'gpt-3.5-turbo-0125',
      tokens: response.response_metadata?.usage,
      cost,
      sessionId,
      userId,
      createdAt: new Date()
    };
    
    await dbService.saveChatMessage(chatMessage);
    
    // Update user's request count
    if (userId) {
      await dbService.incrementUserRequests(userId);
    }
    
    return {
      success: true,
      response: result,
      usage: response.response_metadata?.usage || null,
      cost: cost.toFixed(6),
      messageId: chatMessage.id,
      isContinue: isContinueRequest
    };
  }

  async processChainChat(
    message: string, 
    systemPrompt: string, 
    sessionId: string, 
    userId?: string
  ): Promise<ChatResponse> {
    const messages = aiService.createMessages(message, systemPrompt);
    
    // Handle chain response properly
    let result;
    const model = aiService.pipe(null);
    if (model.invoke) {
      const response = await model.invoke(messages);
      result = typeof response === 'string' ? response : response.content;
    } else {
      const response = await aiService.invoke(messages);
      result = typeof response === 'string' ? response : response.content;
    }
    
    // Save to database
    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      timestamp: new Date(),
      userMessage: message,
      aiResponse: result,
      systemPrompt,
      chatMode: 'chain',
      model: 'gpt-3.5-turbo-0125',
      sessionId,
      userId,
      createdAt: new Date()
    };
    
    await dbService.saveChatMessage(chatMessage);
    
    // Update user's request count
    if (userId) {
      await dbService.incrementUserRequests(userId);
    }
    
    return {
      success: true,
      response: result,
      type: 'chain-response',
      messageId: chatMessage.id
    };
  }

  async processStreamChat(
    message: string, 
    systemPrompt: string, 
    sessionId: string, 
    userId?: string
  ): Promise<string> {
    const messages = aiService.createMessages(message, systemPrompt);
    const stream = await aiService.stream(messages);
    
    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.content;
      if (content) {
        fullResponse += content;
      }
    }
    
    // Save to database after streaming
    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      timestamp: new Date(),
      userMessage: message,
      aiResponse: fullResponse,
      systemPrompt,
      chatMode: 'stream',
      model: 'gpt-3.5-turbo-0125',
      sessionId,
      userId,
      createdAt: new Date()
    };
    
    await dbService.saveChatMessage(chatMessage);
    
    // Update user's request count
    if (userId) {
      await dbService.incrementUserRequests(userId);
    }
    
    return fullResponse;
  }

  async getChatHistory(userId: string): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
    try {
      const messages = await dbService.getChatHistory(50, undefined, userId);
      return { success: true, messages };
    } catch (error) {
      console.error('Failed to get chat history:', error);
      return { success: false, error: 'Failed to get chat history' };
    }
  }

  async clearChatHistory(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deletedCount = await dbService.deleteChatHistoryByUserId(userId);
      return { success: true };
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      return { success: false, error: 'Failed to clear chat history' };
    }
  }

  async processMessage(userId: string, message: string): Promise<{ 
    success: boolean; 
    response?: string; 
    cost?: string; 
    tokensUsed?: number;
    error?: string;
  }> {
    try {
      const sessionId = `session_${userId}_${Date.now()}`;
      const result = await this.processNormalChat(message, '', sessionId, userId);
      
      return {
        success: true,
        response: result.response,
        cost: result.cost,
        tokensUsed: result.usage?.total_tokens || 0
      };
    } catch (error) {
      console.error('Failed to process message:', error);
      return { success: false, error: 'Failed to process message' };
    }
  }
}

export default new ChatService(); 