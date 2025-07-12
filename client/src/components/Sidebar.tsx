import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  sidebarOpen: boolean;
  chatMode: 'normal' | 'chain' | 'stream';
  systemPrompt: string;
  onSidebarToggle: () => void;
  onChatModeChange: (mode: 'normal' | 'chain' | 'stream') => void;
  onSystemPromptChange: (prompt: string) => void;
  onClearChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  chatMode,
  systemPrompt,
  onSidebarToggle,
  onChatModeChange,
  onSystemPromptChange,
  onClearChat
}) => {
  return (
    <>
      <button 
        className="sidebar-toggle"
        onClick={onSidebarToggle}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
      
      <div 
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={onSidebarToggle}
      ></div>
      
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="chat-mode-selector">
            <h3>Chat Mode</h3>
            <div className="mode-buttons">
              <button
                className={chatMode === 'normal' ? 'active' : ''}
                onClick={() => onChatModeChange('normal')}
              >
                💬 Normal
              </button>
              <button
                className={chatMode === 'chain' ? 'active' : ''}
                onClick={() => onChatModeChange('chain')}
              >
                🔗 Chain
              </button>
              <button
                className={chatMode === 'stream' ? 'active' : ''}
                onClick={() => onChatModeChange('stream')}
              >
                🌊 Stream
              </button>
            </div>
          </div>

          <div className="system-prompt">
            <h3>System Prompt</h3>
            <textarea
              value={systemPrompt}
              onChange={(e) => onSystemPromptChange(e.target.value)}
              placeholder="Enter system prompt..."
              rows={4}
            />
          </div>

          <button className="clear-button" onClick={onClearChat}>
            🗑️ Clear Chat
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 