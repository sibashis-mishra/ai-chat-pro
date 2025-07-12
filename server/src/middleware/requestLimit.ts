import { Request, Response, NextFunction } from 'express';
import { authenticateTokenForController } from './auth.js';
import { dbService } from '../services/databaseService.js';

export const checkRequestLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Authenticate user
    const authResult = authenticateTokenForController(req);
    if (!authResult.success) {
      res.status(401).json({ error: authResult.error || 'Unauthorized' });
      return;
    }

    const userId = authResult.userId!;
    const user = await dbService.getUserById(userId);
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Check if user has exceeded their request limit
    if (user.requestsUsed >= user.requestsLimit) {
      res.status(429).json({ 
        error: 'Request limit exceeded',
        message: `You have used ${user.requestsUsed}/${user.requestsLimit} requests.`,
        requestsUsed: user.requestsUsed,
        requestsLimit: user.requestsLimit,
        remainingRequests: 0
      });
      return;
    }

    // Add user info to request for later use
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Request limit check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default checkRequestLimit; 