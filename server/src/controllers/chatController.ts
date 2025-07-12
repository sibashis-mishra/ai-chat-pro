import { Request, Response } from 'express';
import { ChatService } from '../services/chatService.js';
import { RateLimitService } from '../services/rateLimitService.js';
import { authenticateTokenForController } from '../middleware/auth.js';
import { dbService } from '../services/databaseService.js';

const chatService = new ChatService();
const rateLimitService = new RateLimitService();

export class ChatController {
  async sendMessage(req: Request, res: Response) {
    try {
      const { message } = req.body;
      const userId = (req as any).user.id;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
      }

      // Check rate limiting
      const rateLimitKey = `chat:${userId}`;
      if (!rateLimitService.checkRateLimit(rateLimitKey, 10, 60 * 1000)) { // 10 messages per minute
        return res.status(429).json({ error: 'Too many messages. Please slow down.' });
      }

      const result = await chatService.processMessage(userId, message);
      
      if (result.success) {
        res.json({
          success: true,
          response: result.response,
          cost: result.cost,
          tokensUsed: result.tokensUsed
        });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getChatHistory(req: Request, res: Response) {
    try {
      // Authenticate user
      const authResult = authenticateTokenForController(req);
      if (!authResult.success) {
        return res.status(401).json({ error: authResult.error || 'Unauthorized' });
      }

      const userId = authResult.userId!;
      const result = await chatService.getChatHistory(userId);
      
      if (result.success) {
        res.json({
          success: true,
          messages: result.messages
        });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      console.error('Get chat history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async clearChatHistory(req: Request, res: Response) {
    try {
      // Authenticate user
      const authResult = authenticateTokenForController(req);
      if (!authResult.success) {
        return res.status(401).json({ error: authResult.error || 'Unauthorized' });
      }

      const userId = authResult.userId!;
      const result = await chatService.clearChatHistory(userId);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Chat history cleared successfully'
        });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      console.error('Clear chat history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserUsage(req: Request, res: Response) {
    try {
      // Authenticate user
      const authResult = authenticateTokenForController(req);
      if (!authResult.success) {
        return res.status(401).json({ error: authResult.error || 'Unauthorized' });
      }

      const userId = authResult.userId!;
      const user = await dbService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        usage: {
          requestsUsed: user.requestsUsed,
          requestsLimit: user.requestsLimit,
          remainingRequests: user.requestsLimit - user.requestsUsed,
          usagePercentage: Math.round((user.requestsUsed / user.requestsLimit) * 100)
        }
      });
    } catch (error) {
      console.error('Get user usage error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 