import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import { dbService } from '../database.js';
import { AuthenticatedRequest, User } from '../models/types.js';

// Middleware function for Express routes
export const authenticateToken = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    const user = await dbService.getUserById(decoded.userId);
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Function for controllers to check authentication
export const authenticateTokenForController = (req: Request): { success: boolean; userId?: string; error?: string } => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { success: false, error: 'Access token required' };
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    return { success: true, userId: decoded.userId };
  } catch (error) {
    return { success: false, error: 'Invalid token' };
  }
};

export default authenticateToken; 