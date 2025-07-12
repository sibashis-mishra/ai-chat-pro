import React, { useRef, useEffect } from 'react';
import Message from './Message';
import ChatInput from './ChatInput';
import type { Message as MessageType, User } from '../types/index';
import './ChatArea.css';

interface ChatAreaProps {
  messages: MessageType[];
  streamingMessage: string;
  isStreaming: boolean;
  isLoading: boolean;
  chatMode: 'normal' | 'chain' | 'stream';
  sidebarOpen: boolean;
  inputMessage: string;
  onInputChange: (message: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSendMessage: () => void;
  user: User | null;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  streamingMessage,
  isStreaming,
  isLoading,
  chatMode,
  sidebarOpen,
  inputMessage,
  onInputChange,
  onKeyPress,
  onSendMessage,
  user
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const scrollDistance = scrollHeight - scrollTop - clientHeight;
      
      // Show button when user has scrolled up (not at bottom)
      // Hide button when very close to bottom (within 50px)
      const isCloseToBottom = scrollDistance <= 50;
      const hasScrollableContent = scrollHeight > clientHeight + 20; // Check if content is scrollable
      
      const shouldShow = hasScrollableContent && !isCloseToBottom;
      setShowScrollToBottom(shouldShow);
    }
  };

  useEffect(() => {
    scrollToBottom();
    // Check scroll position after messages change
    setTimeout(handleScroll, 100);
  }, [messages, streamingMessage]);

  // Set up scroll listener when component mounts
  useEffect(() => {
    const setupScrollListener = () => {
      const messagesContainer = messagesContainerRef.current;
      if (messagesContainer) {
        // Use passive listener for better performance
        messagesContainer.addEventListener('scroll', handleScroll, { passive: true });
        // Initial check
        handleScroll();
        return () => {
          messagesContainer.removeEventListener('scroll', handleScroll);
        };
      }
      return undefined;
    };

    // Try to set up immediately
    let cleanup = setupScrollListener();
    
    // If not available, try again after a short delay
    if (!cleanup) {
      const timer = setTimeout(() => {
        cleanup = setupScrollListener();
      }, 100);
      return () => {
        clearTimeout(timer);
        if (cleanup) cleanup();
      };
    }
    
    return cleanup;
  }, []); // Only run once on mount

  return (
    <div className={`chat-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.length === 0 && (
          <div className="welcome-message">
            <h2>Welcome to AI Chat Pro! 🚀</h2>
            <p>Choose a chat mode and start testing AI features:</p>
            <ul>
              <li><strong>Normal:</strong> Standard chat with OpenAI</li>
              <li><strong>Chain:</strong> LangChain pipeline with output parsing</li>
              <li><strong>Stream:</strong> Real-time streaming responses</li>
            </ul>
            <p><strong>💡 Tip:</strong> Type "continue" to complete a previous AI response that was cut off</p>
            <p>Current mode: <strong>{chatMode}</strong></p>
          </div>
        )}

        {messages.map((message) => (
          <Message
            key={message.id}
            id={message.id}
            content={message.content}
            sender={message.sender}
            timestamp={message.timestamp}
            type={message.type}
            isContinue={message.isContinue}
          />
        ))}

        {isStreaming && streamingMessage && (
          <div className="message ai">
            <div className="message-content">
              <div className="message-header">
                <span className="sender">🤖 AI</span>
                <span className="timestamp">Streaming...</span>
                <span className="message-type">🌊</span>
              </div>
              <div className="message-text streaming">
                {streamingMessage}
                <span className="cursor">|</span>
              </div>
            </div>
          </div>
        )}

        {isLoading && !isStreaming && (
          <div className="message ai">
            <div className="message-content">
              <div className="message-header">
                <span className="sender">🤖 AI</span>
                <span className="timestamp">Thinking...</span>
              </div>
              <div className="message-text">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        <div className="mobile-bottom-spacer" />
      </div>
      
      {/* Standalone scroll button - no CSS classes */}
      <div
        style={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '2.5rem',
          height: '2.5rem',
          background: '#40414f',
          color: '#ececf1',
          border: '1px solid #4a4b53',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '1.2rem',
          zIndex: 9999,
          display: showScrollToBottom ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0.25rem 0.75rem rgba(0, 0, 0, 0.3)',
          userSelect: 'none',
          transition: 'all 0.2s ease'
        }}
        onClick={scrollToBottom}
        title="Scroll to bottom"
      >
        ↓
      </div>
      


      <ChatInput
        inputMessage={inputMessage}
        isLoading={isLoading}
        isStreaming={isStreaming}
        user={user}
        onInputChange={onInputChange}
        onKeyPress={onKeyPress}
        onSendMessage={onSendMessage}
      />
    </div>
  );
};

export default ChatArea; 