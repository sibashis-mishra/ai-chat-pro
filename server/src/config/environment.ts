import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEBUG: process.env.DEBUG === 'true',
  
  // CORS Configuration
  CLIENT_URL: process.env.CLIENT_URL,
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  
  // MongoDB Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  MONGODB_DATABASE: process.env.MONGODB_DATABASE || 'ai-chat-pro',
  
  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  
  // Cost Optimization Settings
  MAX_TOKENS_PER_REQUEST: parseInt(process.env.MAX_TOKENS_PER_REQUEST || '150'),
  TEMPERATURE: parseFloat(process.env.TEMPERATURE || '0.3'),
  RATE_LIMIT_PER_MINUTE: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10'),
  
  // Cost tracking
  COST_PER_1K_TOKENS: 0.0005, // gpt-3.5-turbo-0125 cost
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 60000, // 1 minute in milliseconds
};

export default config; 