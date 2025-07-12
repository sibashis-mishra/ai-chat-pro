import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbService } from './services/databaseService.js';
import { config } from './config/environment.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { RateLimitService } from './services/rateLimitService.js';
import { AuthService } from './services/authService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.PORT;
const rateLimitService = new RateLimitService();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI Chat Pro Server is running!',
    timestamp: new Date().toISOString(),
    databaseConnected: dbService.isConnected()
  });
});

// Test endpoint to check database
app.get('/api/test-db', async (req, res) => {
  try {
    const dbInfo = await dbService.getDatabaseInfo();
    res.json({
      success: true,
      databaseInfo: dbInfo
    });
  } catch (error) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseConnected: dbService.isConnected()
    });
  }
});

// Test endpoint to create a test user (for debugging)
app.post('/api/test-create-user', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const authService = new AuthService();
    const result = await authService.register(email, password);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test user created',
        user: result.user
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create test user' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = await dbService.getAnalytics();
    const costBreakdown = await dbService.getCostBreakdown();
    res.json({
      ...analytics,
      costBreakdown
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Cost tracking endpoint
app.get('/api/costs', async (req, res) => {
  try {
    const analytics = await dbService.getAnalytics();
    const COST_PER_1K_TOKENS = 0.0005; // gpt-3.5-turbo-0125 cost
    
    res.json({
      totalTokensUsed: analytics.totalTokens,
      totalCost: analytics.totalCost.toFixed(6),
      costPer1KTokens: COST_PER_1K_TOKENS,
      estimatedMonthlyCost: (analytics.totalCost * 30).toFixed(2),
      totalConversations: analytics.totalConversations,
      averageTokensPerResponse: analytics.averageTokensPerResponse
    });
  } catch (error) {
    console.error('Cost tracking error:', error);
    res.status(500).json({ error: 'Failed to get cost data' });
  }
});

// Legacy endpoints for backward compatibility
app.get('/api/history', async (req, res) => {
  try {
    const { limit = 50, sessionId } = req.query;
    const history = await dbService.getChatHistory(Number(limit), sessionId as string);
    res.json(history);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await dbService.connect();
    
    // Ensure special user limits are set
    const authService = new AuthService();
    await authService.ensureSpecialUserLimits();
    
    app.listen(PORT, () => {
      console.log(`🚀 AI Chat Pro Server running on port ${PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log(`🔐 JWT Secret: ${config.JWT_SECRET ? 'Configured' : 'Using default (change in production)'}`);
      console.log(`🤖 AI Model: ${config.OPENAI_API_KEY ? 'OpenAI' : 'Mock AI (for testing)'}`);
    });

    // Set up periodic cleanup for rate limiting
    setInterval(() => {
      rateLimitService.cleanup();
    }, 5 * 60 * 1000); // Clean up every 5 minutes

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    await dbService.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  try {
    await dbService.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}); 