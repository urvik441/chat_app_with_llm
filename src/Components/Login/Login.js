import React, { useState } from 'react';
import '../ChatApp.css';
import './Login.css';
import credentials from '../../credentials.json';
import { Sparkles, Bot, Lock, User } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();
    if (!trimmedUser || !trimmedPass) {
      setError('Please enter username and password.');
      return;
    }

    setIsSubmitting(true);

    // Simple front-end credential check against JSON
    const match = credentials.users.find(
      (u) => u.username === trimmedUser && u.password === trimmedPass
    );

    setTimeout(() => {
      if (match) {
        // You could persist this in localStorage if you want
        onLoginSuccess({ username: match.username });
      } else {
        setError('Invalid credentials. Try demo_user / demo_pass or admin / admin123.');
      }
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="login-root">
      <div className="login-main">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-avatar">
              <Bot size={20} />
            </div>
            <div className="login-header-text">
              <h1 className="login-title">Welcome back</h1>
              <p className="login-subtitle">Log in to access your AI chat workspace.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label
                htmlFor="username"
                className="login-label"
              >
                Username
              </label>
              <div className="login-input-wrapper">
                <User size={18} className="login-input-icon" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="demo_user or admin"
                  autoComplete="username"
                  className="login-input"
                />
              </div>
            </div>

            <div className="login-field">
              <label
                htmlFor="password"
                className="login-label"
              >
                Password
              </label>
              <div className="login-input-wrapper">
                <Lock size={18} className="login-input-icon" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="demo_pass or admin123"
                  autoComplete="current-password"
                  className="login-input"
                />
              </div>
            </div>

            {error && (
              <p className="login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="login-submit-btn"
            >
              {isSubmitting ? 'Verifying…' : 'Enter workspace'}
            </button>

            <p className="login-hint">
              Try <strong>demo_user / demo_pass</strong> or{' '}
              <strong>admin / admin123</strong>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

