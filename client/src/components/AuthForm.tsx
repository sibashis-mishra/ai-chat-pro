import React from 'react';
import './AuthForm.css';

interface AuthFormProps {
  authMode: 'login' | 'signup';
  authEmail: string;
  authPassword: string;
  authError: string;
  onAuthModeChange: (mode: 'login' | 'signup') => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({
  authMode,
  authEmail,
  authPassword,
  authError,
  onAuthModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit
}) => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🤖 AI Chat Pro</h1>
        <p>Sign in to start chatting with AI</p>
        
        <div className="auth-tabs">
          <button 
            className={authMode === 'login' ? 'active' : ''} 
            onClick={() => onAuthModeChange('login')}
          >
            Sign In
          </button>
          <button 
            className={authMode === 'signup' ? 'active' : ''} 
            onClick={() => onAuthModeChange('signup')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={authEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={authPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
          />
          {authError && <div className="auth-error">{authError}</div>}
          <button type="submit">
            {authMode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-info">
          <p>✨ Free tier: 10 requests per user</p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm; 