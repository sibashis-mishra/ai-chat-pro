# 🚀 Vercel Deployment Guide

This guide will help you deploy your full-stack AI Chat Pro application to Vercel.

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be pushed to a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Atlas**: Set up a MongoDB database (free tier available)
4. **Environment Variables**: Prepare your environment configuration

## 🔧 Step 1: Prepare Your Repository

### 1.1 Update API Configuration
The client has been configured to automatically detect the production URL. The API base URL will be:
- **Development**: `http://localhost:3001`
- **Production**: Automatically uses the Vercel deployment URL

### 1.2 Commit Your Changes
```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

## 🌐 Step 2: Deploy to Vercel

### 2.1 Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository
4. Select the repository containing your project

### 2.2 Configure Project Settings

#### Root Directory Configuration
Since your project has both client and server, you'll need to configure it as a monorepo:

1. **Framework Preset**: Select "Other" (since we have custom build configuration)
2. **Root Directory**: Leave as `/` (root)
3. **Build Command**: Leave empty (Vercel will auto-detect from vercel.json)
4. **Output Directory**: Leave empty (Vercel will auto-detect from vercel.json)

### 2.3 Environment Variables
Add the following environment variables in Vercel:

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |
| `JWT_SECRET` | Secret for JWT tokens | `your-super-secret-key-here` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `MONGODB_DATABASE` | Database name | `ai-chat-pro` |
| `NODE_ENV` | Environment | `production` |

### 2.4 Advanced Settings
In the Vercel project settings:

1. **Functions**: Set to `server/src` (for serverless functions)
2. **Build & Development Settings**:
   - Build Command: `cd client && yarn build`
   - Output Directory: `client/dist`
   - Install Command: `yarn install`

## 🔄 Step 3: Deploy

1. Click **"Deploy"**
2. Vercel will automatically:
   - Install dependencies
   - Build the client
   - Deploy the server as serverless functions
   - Set up routing

## 🌍 Step 4: Configure Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update your DNS settings as instructed

## 🔧 Step 5: Update API URL

After deployment, update the API URL in your client:

1. Go to your Vercel deployment URL
2. Copy the URL (e.g., `https://your-project.vercel.app`)
3. Update the environment variable in Vercel:
   - Add `VITE_API_BASE_URL` with your Vercel URL

## 🧪 Step 6: Test Your Deployment

1. **Frontend**: Visit your Vercel URL
2. **Backend**: Test API endpoints at `https://your-url.vercel.app/api/health`
3. **Authentication**: Try signing up/signing in
4. **Chat**: Test the AI chat functionality

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation works locally
   - Verify environment variables are set
   - If you get "cd: client: No such file or directory" error:
     - Verify the client directory exists in your repository
     - Check that the vercel.json configuration is correct
     - Try using the "builds" configuration instead of "buildCommand"

2. **API Errors**:
   - Check MongoDB connection
   - Verify JWT secret is set
   - Ensure CORS is configured properly

3. **Client-Server Communication**:
   - Verify API base URL is correct
   - Check that routes are properly configured
   - Ensure serverless functions are working

### Debug Commands

```bash
# Test local build
cd client && yarn build
cd server && yarn build

# Test local server
cd server && yarn start

# Check environment variables
echo $MONGODB_URI
echo $JWT_SECRET
```

## 📊 Monitoring

1. **Vercel Analytics**: Monitor performance and errors
2. **Function Logs**: Check serverless function execution
3. **Database**: Monitor MongoDB Atlas usage

## 🔄 Continuous Deployment

Once configured, Vercel will automatically:
- Deploy on every push to main branch
- Run preview deployments for pull requests
- Provide rollback capabilities

## 🎉 Success!

Your AI Chat Pro application is now deployed and accessible worldwide!

### Next Steps:
1. Set up monitoring and alerts
2. Configure custom domain
3. Set up CI/CD pipelines
4. Monitor usage and costs

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review environment variables
3. Test locally first
4. Check MongoDB connection
5. Verify API endpoints are working 