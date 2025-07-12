import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import AuthForm from './components/AuthForm';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import LoadingScreen from './components/LoadingScreen';
import type { Message, ChatResponse, ChatHistoryItem, User } from './types/index';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'normal' | 'chain' | 'stream'>('normal');
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, ] = useState(false);
  const [, setSessionId] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');



  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      checkAuthStatus(token);
    } else {
      setIsLoadingHistory(false);
    }
  }, []);

  // Periodically refresh user usage
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshUserUsage();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const checkAuthStatus = async (token: string) => {
    try {
      // Get user info from usage endpoint since /api/auth/me doesn't exist in new API
      const response = await axios.get(`${API_BASE_URL}/api/chat/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Get user info from the token payload or create a minimal user object
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      console.log('🔍 Token payload:', tokenPayload);
      
      const user: User = {
        id: tokenPayload.userId,
        email: tokenPayload.email || 'user@example.com', // Fallback email
        requestsUsed: response.data.usage.requestsUsed,
        requestsLimit: response.data.usage.requestsLimit
      };
      
      setUser(user);
      setIsAuthenticated(true);
      setShowAuth(false);
      loadChatHistory(token);
    } catch (error) {
      localStorage.removeItem('authToken');
      setIsLoadingHistory(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      console.log('🔍 Auth request:', { endpoint, username: authEmail, mode: authMode });
      
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        username: authEmail, // Server expects 'username' field
        password: authPassword
      });

      console.log('🔍 Auth response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('authToken', token);
        setUser(user);
        setIsAuthenticated(true);
        setShowAuth(false);
        loadChatHistory(token);
      } else {
        setAuthError(response.data.error || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('🔍 Auth error:', error.response?.data || error.message);
      setAuthError(error.response?.data?.error || 'Authentication failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    setShowAuth(true);
    setMessages([]);
  };

  // Generate session ID and load history on component mount
  const loadChatHistory = async (token: string) => {
    const generateSessionId = () => {
      return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };

    try {
      // Get or create session ID
      let currentSessionId = localStorage.getItem('chatSessionId');
      if (!currentSessionId) {
        currentSessionId = generateSessionId();
        localStorage.setItem('chatSessionId', currentSessionId);
      }
      setSessionId(currentSessionId);

      // Load chat history from database
      const response = await axios.get(`${API_BASE_URL}/api/chat/history`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success && response.data.messages && response.data.messages.length > 0) {
        const historyMessages: Message[] = response.data.messages
          .sort((a: ChatHistoryItem, b: ChatHistoryItem) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          .flatMap((item: ChatHistoryItem) => [
            {
              id: item.id + '_user',
              content: item.userMessage,
              sender: 'user' as const,
              timestamp: new Date(item.timestamp),
              type: item.chatMode
            },
            {
              id: item.id + '_ai',
              content: item.aiResponse,
              sender: 'ai' as const,
              timestamp: new Date(item.timestamp),
              type: item.chatMode
            }
          ]);

        setMessages(historyMessages);
        
        // Update system prompt from last conversation if available
        const lastItem = response.data.messages[response.data.messages.length - 1];
        if (lastItem.systemPrompt) {
          setSystemPrompt(lastItem.systemPrompt);
        }
      }
    } catch (error) {
      console.log('No chat history found or database not available');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const addMessage = (content: string, sender: 'user' | 'ai', type: 'normal' | 'chain' | 'stream' = 'normal', isContinue?: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date(),
      type,
      isContinue
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) return;

    // Check request limit
    if (user.requestsUsed >= user.requestsLimit) {
      setAuthError('You have reached your request limit.');
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    addMessage(userMessage, 'user', chatMode);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post<ChatResponse>(`${API_BASE_URL}/api/chat/message`, {
        message: userMessage
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        addMessage(response.data.response, 'ai', chatMode);
        // Update user's request count
        if (user) {
          setUser({ ...user, requestsUsed: user.requestsUsed + 1 });
        }
        // Refresh user usage to get accurate count
        await refreshUserUsage();
      } else {
        const errorMessage = response.data.error || 'Sorry, I encountered an error. Please try again.';
        addMessage(errorMessage, 'ai', chatMode);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error.response?.status === 429) {
        const errorData = error.response.data;
        setAuthError(errorData.message || 'You have reached your request limit.');
        // Update user info with current usage
        if (errorData.requestsUsed !== undefined && errorData.requestsLimit !== undefined && user) {
          setUser({ ...user, requestsUsed: errorData.requestsUsed, requestsLimit: errorData.requestsLimit });
        }
      } else {
        addMessage('Sorry, I encountered an error. Please try again.', 'ai', chatMode);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_BASE_URL}/api/chat/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages([]);
      setStreamingMessage('');
      // Generate new session ID
      const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  };

  const refreshUserUsage = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/chat/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUser({
          ...user,
          requestsUsed: response.data.usage.requestsUsed,
          requestsLimit: response.data.usage.requestsLimit
        });
      }
    } catch (error) {
      console.error('Failed to refresh user usage:', error);
    }
  };

  if (isLoadingHistory) {
    return <LoadingScreen />;
  }

  if (showAuth) {
    return (
      <div className="app">
        <AuthForm
          authMode={authMode}
          authEmail={authEmail}
          authPassword={authPassword}
          authError={authError}
          onAuthModeChange={setAuthMode}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onSubmit={handleAuth}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Header user={user} onLogout={logout} />
      
      <div className="chat-container">
        <Sidebar
          sidebarOpen={sidebarOpen}
          chatMode={chatMode}
          systemPrompt={systemPrompt}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          onChatModeChange={setChatMode}
          onSystemPromptChange={setSystemPrompt}
          onClearChat={clearChat}
        />

        <ChatArea
          messages={messages}
          streamingMessage={streamingMessage}
          isStreaming={isStreaming}
          isLoading={isLoading}
          chatMode={chatMode}
          sidebarOpen={sidebarOpen}
          inputMessage={inputMessage}
          onInputChange={setInputMessage}
          onKeyPress={handleKeyPress}
          onSendMessage={sendMessage}
          user={user}
        />
      </div>
    </div>
  );
}

export default App;
