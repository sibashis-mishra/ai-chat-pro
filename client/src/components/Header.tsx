import React from 'react';
import { LogoutOutlined } from '@ant-design/icons';
import type { User } from '../types/index';
import './Header.css';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-content">
        <h1>🤖 AI Chat Pro</h1>
        <div className="user-info">
          <span>{user?.email}</span>
          <span className={`request-count ${user?.requestsLimit === 100 ? 'special-user' : ''}`}>
            {user?.requestsUsed}/{user?.requestsLimit} requests
            {user?.requestsLimit === 100 && <span className="special-badge">⭐</span>}
          </span>
          <button onClick={onLogout} className="logout-btn" aria-label="Logout">
            <LogoutOutlined />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 