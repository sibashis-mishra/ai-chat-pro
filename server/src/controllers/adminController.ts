import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { authenticateTokenForController } from '../middleware/auth.js';

const authService = new AuthService();

export class AdminController {
  async updateUserRequestLimit(req: Request, res: Response) {
    try {
      // Authenticate user (you might want to add admin role checking here)
      const authResult = authenticateTokenForController(req);
      if (!authResult.success) {
        return res.status(401).json({ error: authResult.error || 'Unauthorized' });
      }

      const { userId, newLimit } = req.body;

      if (!userId || typeof newLimit !== 'number' || newLimit < 0) {
        return res.status(400).json({ error: 'Valid userId and newLimit are required' });
      }

      const result = await authService.updateUserRequestLimit(userId, newLimit);
      
      if (result.success) {
        res.json({
          success: true,
          message: `Updated user ${userId} request limit to ${newLimit}`
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Update user request limit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSpecialUserInfo(req: Request, res: Response) {
    try {
      // Authenticate user
      const authResult = authenticateTokenForController(req);
      if (!authResult.success) {
        return res.status(401).json({ error: authResult.error || 'Unauthorized' });
      }

      const specialUserId = '1752297695916';
      const user = await authService.getCurrentUser(specialUserId);
      
      if (user) {
        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            requestsUsed: user.requestsUsed,
            requestsLimit: user.requestsLimit,
            remainingRequests: user.requestsLimit - user.requestsUsed
          }
        });
      } else {
        res.status(404).json({ error: 'Special user not found' });
      }
    } catch (error) {
      console.error('Get special user info error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 