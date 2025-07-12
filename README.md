# 🤖 AI Chat Pro

A modern AI chat application with user authentication, request limits, and multiple AI models. Built with React, TypeScript, Express, and MongoDB. Features a ChatGPT-like interface with smooth scrolling, persistent chat history, and real-time streaming responses.

## ✨ Features

- **🔐 User Authentication**: Sign up and sign in with email/password
- **📊 Request Limits**: 10 requests per user (free tier), 100 for special users
- **💬 Multiple Chat Modes**: Normal, Chain, and Streaming
- **🎨 ChatGPT-like Interface**: Modern, responsive UI with smooth scrolling and scroll-to-bottom button
- **💾 Chat History**: Persistent chat sessions with MongoDB
- **💰 Cost Tracking**: Monitor AI usage and costs
- **🤖 Multiple AI Models**: OpenAI GPT-3.5-turbo or Mock AI for testing
- **📱 Responsive Design**: Works on desktop and mobile
- **🎯 Smart Scroll**: Auto-scroll to bottom with manual scroll-to-bottom button
- **🏗️ Clean Architecture**: Model-Controller-Route-Service pattern
- **🔒 Rate Limiting**: Per-user request limits with middleware
- **📈 Analytics**: User usage tracking and cost breakdown

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and Yarn
- MongoDB (for chat history and user management)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd landchain-poc
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server && yarn install
   
   # Install client dependencies
   cd ../client && yarn install
   ```

3. **Environment Setup**
   
   Copy `server/env.example` to `server/.env` and configure your environment variables. See the [Configuration](#-configuration) section below for details.

4. **Start the application**
   ```bash
   # Start server (from server directory)
   cd server && yarn dev
   
   # Start client (from client directory, in new terminal)
   cd client && yarn dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## 🔐 Authentication

### Sign Up
- Create a new account with email and password
- Get 10 free requests to test the AI features
- Secure password hashing with bcrypt

### Sign In
- Login with your email and password
- JWT token-based authentication
- Automatic session management

### Request Limits
- **Free Tier**: 10 requests per user
- **Special Users**: 100 requests (configurable)
- Request counter displayed in header
- Upgrade prompts when limit reached

## 💬 Chat Features

### Chat Modes

1. **Normal Chat** 💬
   - Standard AI conversation
   - Cost-optimized responses
   - Token usage tracking

2. **Chain Chat** 🔗
   - LangChain pipeline processing
   - Advanced AI workflows
   - Structured output parsing

3. **Stream Chat** 🌊
   - Real-time streaming responses
   - Character-by-character display
   - Simulated typing effect

### System Prompts
- Customize AI behavior per session
- Persistent across chat sessions
- Examples provided in sidebar

## 🎨 User Interface

### ChatGPT-like Design
- Dark theme with modern styling
- Smooth scrolling message container
- Responsive sidebar with controls
- Loading animations and indicators

### Features
- **Auto-scroll**: Messages automatically scroll to bottom
- **Scroll-to-bottom button**: Manual scroll button appears when scrolled up
- **Message Types**: Visual indicators for different chat modes
- **Timestamps**: Message timing display
- **User Info**: Email and request count in header
- **Clear Chat**: Reset conversation with new session

## 📊 Analytics & Monitoring

### Cost Tracking
- Token usage per request
- Cost calculation (OpenAI pricing)
- Monthly cost estimates
- Usage analytics

### Chat History
- Persistent message storage
- Session-based organization
- User-specific history
- Export capabilities

## 🔧 Configuration

### Environment Variables

Copy `server/env.example` to `server/.env` and configure the following variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | `undefined` (uses mock) | No |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` | Yes |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ai-chat-pro` | Yes |
| `MONGODB_DATABASE` | MongoDB database name | `ai-chat-pro` | No |
| `MAX_TOKENS_PER_REQUEST` | Maximum tokens per AI response | `150` | No |
| `TEMPERATURE` | AI response randomness | `0.3` | No |
| `RATE_LIMIT_PER_MINUTE` | Rate limit per IP | `10` | No |
| `PORT` | Server port | `3001` | No |
| `NODE_ENV` | Environment mode | `development` | No |

### AI Model Configuration

The app automatically detects available AI models:

1. **OpenAI GPT-3.5-turbo** (if API key provided)
   - Cost-optimized settings
   - Lower temperature for focused responses
   - Token limits for cost control

2. **Mock AI** (fallback)
   - No API key required
   - Simulated responses for testing
   - Perfect for development

## 🛠️ Development

### Project Structure
```
landchain-poc/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── AuthForm.tsx
│   │   │   ├── ChatArea.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── Message.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main application
│   │   └── main.tsx        # Entry point
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   │   ├── database.ts
│   │   │   └── environment.ts
│   │   ├── controllers/    # Request handlers
│   │   │   ├── authController.ts
│   │   │   └── chatController.ts
│   │   ├── routes/         # API routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── chatRoutes.ts
│   │   │   └── adminRoutes.ts
│   │   ├── services/       # Business logic
│   │   │   ├── authService.ts
│   │   │   ├── chatService.ts
│   │   │   ├── databaseService.ts
│   │   │   └── rateLimitService.ts
│   │   ├── models/         # Data models
│   │   │   ├── User.ts
│   │   │   └── ChatMessage.ts
│   │   ├── middleware/     # Express middleware
│   │   │   ├── auth.ts
│   │   │   └── rateLimit.ts
│   │   ├── utils/          # Utility functions
│   │   │   ├── aiModel.ts
│   │   │   └── costTracking.ts
│   │   ├── types/          # TypeScript types
│   │   └── index.ts        # Main server
│   ├── env.example         # Environment template
│   └── package.json
└── README.md
```

### Architecture Pattern

The server follows a clean **Controller-Route-Service-Model** pattern:

- **Controllers**: Handle HTTP requests and responses
- **Routes**: Define API endpoints and middleware
- **Services**: Contain business logic and external integrations
- **Models**: Define data structures and database operations
- **Middleware**: Handle authentication, rate limiting, and validation

### Available Scripts

**Server:**
```bash
yarn dev      # Development with hot reload
yarn build    # Build for production
yarn start    # Start production server
```

**Client:**
```bash
yarn dev      # Development server
yarn build    # Build for production
yarn preview  # Preview production build
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Request Validation**: Input sanitization
- **Rate Limiting**: Per-user request limits with middleware
- **CORS Protection**: Configured for development
- **Request Limits**: Configurable per-user limits

## 📱 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Chat
- `POST /api/chat` - Normal chat
- `POST /api/chain-chat` - Chain-based chat
- `POST /api/stream-chat` - Streaming chat

### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/limit` - Update user request limit

### Health & Debug
- `GET /health` - Server status
- `GET /api/test-db` - Database connection test
- `POST /api/test-create-user` - Create test user

### History
- `GET /api/history` - Chat history

## 🚀 Deployment

### Prerequisites
- Node.js 18+
- MongoDB (for full functionality)
- Environment variables configured

### Production Build
```bash
# Build both client and server
cd client && yarn build
cd ../server && yarn build

# Start production server
cd server && yarn start
```

### Production Environment

For production deployment, ensure all environment variables are properly configured. The same variables from the [Configuration](#-configuration) section apply, with production-appropriate values.

## 🐛 Troubleshooting

### Common Issues

1. **401 Authentication Error**
   - Ensure user exists in database
   - Check JWT_SECRET is configured
   - Verify password is correct

2. **Database Connection Issues**
   - Check MongoDB URI in environment
   - Ensure MongoDB is running
   - Test connection with `/api/test-db` endpoint

3. **Request Limit Errors**
   - Check user's request count
   - Verify rate limiting middleware
   - Use admin endpoints to adjust limits

### Debug Endpoints

- `GET /api/test-db` - Test database connection
- `POST /api/test-create-user` - Create test user
- `GET /health` - Server health check

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with details

---

**AI Chat Pro** - Modern AI chat with authentication and limits 🚀 