import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { RateLimitService } from '../services/rateLimitService.js';

const authService = new AuthService();
const rateLimitService = new RateLimitService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Check rate limiting - use username instead of IP to be user-specific
      const rateLimitKey = `login:${username}`;
      
      if (!rateLimitService.checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) { // 5 attempts per 15 minutes
        return res.status(429).json({ error: 'Too many login attempts for this account. Please try again later.' });
      }

      const result = await authService.login(username, password);
      
      if (result.success) {
        res.json({
          success: true,
          token: result.token,
          user: result.user
        });
      } else {
        res.status(401).json({ error: result.error });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Check rate limiting - use username instead of IP to be user-specific
      const rateLimitKey = `register:${username}`;
      
      if (!rateLimitService.checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000)) { // 3 attempts per hour
        return res.status(429).json({ error: 'Too many registration attempts for this email. Please try again later.' });
      }

      const result = await authService.register(username, password);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          user: result.user
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 