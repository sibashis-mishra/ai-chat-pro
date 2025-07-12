import React from 'react';
import type { User } from '../types/index';
import './ChatInput.css';

interface ChatInputProps {
  inputMessage: string;
  isLoading: boolean;
  isStreaming: boolean;
  user: User | null;
  onInputChange: (message: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSendMessage: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputMessage,
  isLoading,
  isStreaming,
  user,
  onInputChange,
  onKeyPress,
  onSendMessage
}) => {
  const isDisabled = isLoading || isStreaming || (user ? user.requestsUsed >= user.requestsLimit : false);
  const hasReachedLimit = user && user.requestsUsed >= user.requestsLimit;

  return (
    <div className="input-container">
      <div className="input-wrapper">
        <textarea
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Type your message... (Enter to send)"
          rows={1}
          disabled={isDisabled}
        />
        <button
          onClick={onSendMessage}
          disabled={!inputMessage.trim() || isDisabled}
          className="send-button"
        >
          {isLoading || isStreaming ? '⏳' : '📤'}
        </button>
      </div>
      {hasReachedLimit && (
        <div className="limit-warning">
          ⚠️ You have reached your request limit.
        </div>
      )}
    </div>
  );
};

export default ChatInput; 