import React, { useState } from 'react';
import { login as apiLogin } from './api';
// styles moved to global.css

function Login({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user, accessToken, refreshToken } = await apiLogin({ identifier: email, password });
      if (!accessToken || !user) throw new Error('Invalid response');
      onLogin && onLogin({ user, accessToken, refreshToken, remember });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Demo filler removed to avoid unused variable warning

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="left-overlay-grid" />
        <div className="left-ornament left-ornament--one" />
        <div className="left-ornament left-ornament--two" />
        <div className="brand-row">
          <div className="brand-badge">FL</div>
          <h1 className="brand-name">FPTU Lab Events</h1>
        </div>
        <div className="left-content">
          <h2 className="headline">Smart Lab Booking & Event Management</h2>
          <p className="subhead">Unified platform for booking labs, approvals, notifications and usage insights at FPT University.</p>
          <ul className="features">
            <li>
              <span className="feature-icon" aria-hidden>✔</span>
              <span>Conflict-free booking and approvals</span>
            </li>
            <li>
              <span className="feature-icon" aria-hidden>✔</span>
              <span>Recurring events and blackout dates</span>
            </li>
            <li>
              <span className="feature-icon" aria-hidden>✔</span>
              <span>Equipment and room management</span>
            </li>
            <li>
              <span className="feature-icon" aria-hidden>✔</span>
              <span>QR check-in and reporting</span>
            </li>
          </ul>
        </div>
        <div className="footer-note">© {new Date().getFullYear()} FPTU Lab Events</div>
      </div>

      <div className="login-right">
        <div className="panel">
          <div className="panel-header">
            <h2>Welcome</h2>
            <p>Sign in to continue to Lab Events</p>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrap">
                <span className="input-icon" aria-hidden>@</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@fptu.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <span className="input-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" focusable="false" aria-hidden="true">
                    <path d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 116 0v3H9zm3 4a2 2 0 110 4 2 2 0 010-4z"></path>
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-action"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" focusable="false">
                      <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10z"></path>
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" focusable="false">
                      <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10z"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-row">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button type="button" className="link" onClick={() => {}} aria-label="Forgot password">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="error-text" role="alert">{error}</div>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="form-footer">
            <span>Don't have an account?</span>
            <button type="button" className="link" onClick={onSwitchToRegister}>Sign Up</button>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Login;


