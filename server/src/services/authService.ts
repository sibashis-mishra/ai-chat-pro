import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import { dbService } from './databaseService.js';
import { User } from '../models/types.js';

export class AuthService {
  async register(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('🔍 Registration attempt for username:', username);
      
      // Check if database is connected
      if (!dbService.isConnected()) {
        console.log('❌ Database not connected');
        return { success: false, error: 'Database not available' };
      }

      // Check if user already exists
      const existingUser = await dbService.getUserByEmail(username);
      console.log('🔍 Existing user found:', existingUser ? 'Yes' : 'No');
      
      if (existingUser) {
        console.log('❌ User already exists:', username);
        return { success: false, error: 'User already exists' };
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user with appropriate request limit
      const user = await dbService.createUser({
        email: username,
        password: hashedPassword,
        requestsUsed: 0,
        requestsLimit: 10 // Default limit, will be updated if needed
      });

      console.log('✅ User created with ID:', user.id);

      // Update request limit for specific user
      if (user.id === '1752297695916') {
        await dbService.updateUser(user.id, { requestsLimit: 100 });
        user.requestsLimit = 100;
        console.log('⭐ Special user limit updated to 100 requests');
      }

      console.log('✅ Registration successful for user:', username);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, error: 'Failed to create user' };
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; token?: string; user?: User; error?: string }> {
    try {
      console.log('🔍 Login attempt for username:', username);
      
      // Check if database is connected
      if (!dbService.isConnected()) {
        console.log('❌ Database not connected');
        return { success: false, error: 'Database not available' };
      }

      // Find user by email (username is actually the email)
      const user = await dbService.getUserByEmail(username);
      console.log('🔍 User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        console.log('❌ User not found for email:', username);
        return { success: false, error: 'Invalid credentials' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('🔍 Password valid:', isValidPassword ? 'Yes' : 'No');
      
      if (!isValidPassword) {
        console.log('❌ Invalid password for user:', username);
        return { success: false, error: 'Invalid credentials' };
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, config.JWT_SECRET, { expiresIn: '7d' });
      console.log('✅ Login successful for user:', username);

      return { success: true, token, user };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Failed to authenticate' };
    }
  }

  async getCurrentUser(userId: string): Promise<User | null> {
    return await dbService.getUserById(userId);
  }

  async updateUserRequestLimit(userId: string, newLimit: number): Promise<{ success: boolean; error?: string }> {
    try {
      const updated = await dbService.updateUser(userId, { requestsLimit: newLimit });
      if (updated) {
        return { success: true };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Failed to update user request limit:', error);
      return { success: false, error: 'Failed to update request limit' };
    }
  }

  async ensureSpecialUserLimits(): Promise<void> {
    try {
      // Update specific user to have 100 requests
      const specialUserId = '1752297695916';
      const user = await dbService.getUserById(specialUserId);
      
      if (user && user.requestsLimit !== 100) {
        await this.updateUserRequestLimit(specialUserId, 100);
        console.log(`✅ Updated user ${specialUserId} to have 100 requests`);
      }
    } catch (error) {
      console.error('Failed to ensure special user limits:', error);
    }
  }
}

export default new AuthService(); 