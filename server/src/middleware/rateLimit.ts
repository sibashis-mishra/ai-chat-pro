import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment.js';
import { RateLimitData } from '../models/types.js';

// Rate limiting storage
const requestCounts = new Map<string, RateLimitData>();

export const rateLimit = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const clientIP = req.ip || 'unknown';
  const now = Date.now();
  
  if (!requestCounts.has(clientIP)) {
    requestCounts.set(clientIP, { 
      count: 0, 
      resetTime: now + config.RATE_LIMIT_WINDOW 
    });
  }
  
  const clientData = requestCounts.get(clientIP)!;
  
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + config.RATE_LIMIT_WINDOW;
  }
  
  if (clientData.count >= config.RATE_LIMIT_PER_MINUTE) {
    res.status(429).json({ 
      error: 'Rate limit exceeded', 
      message: `Maximum ${config.RATE_LIMIT_PER_MINUTE} requests per minute allowed` 
    });
    return;
  }
  
  clientData.count++;
  next();
};

export const checkRequestLimit = async (
  req: any, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  
  if (user.requestsUsed >= user.requestsLimit) {
    res.status(429).json({ 
      error: 'Request limit exceeded',
      message: `You have used ${user.requestsUsed}/${user.requestsLimit} requests.`
    });
    return;
  }
  
  next();
};

export default { rateLimit, checkRequestLimit }; 