import React from 'react';
import './Message.css';

interface MessageProps {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'normal' | 'chain' | 'stream';
  isContinue?: boolean;
}

const Message: React.FC<MessageProps> = ({
  content,
  sender,
  timestamp,
  type,
  isContinue
}) => {
  return (
    <div className={`message ${sender === 'user' ? 'user' : 'ai'}`}>
      <div className="message-content">
        <div className="message-header">
          <span className="sender">
            {sender === 'user' ? '👤 You' : '🤖 AI'}
          </span>
          <span className="timestamp">
            {timestamp.toLocaleTimeString()}
          </span>
          {isContinue && (
            <span className="continue-indicator">🔄 Continue</span>
          )}
          {type && type !== 'normal' && (
            <span className="message-type">
              {type === 'chain' ? '🔗' : '🌊'}
            </span>
          )}
        </div>
        <div className="message-text">{content}</div>
      </div>
    </div>
  );
};

export default Message; 