import React, { useState } from 'react';
import { login as apiLogin, authApi } from '../../api';
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
      const status = (user.status || user.Status || '').toString().toLowerCase();
      if (status && status !== 'active') {
        throw new Error('Your account is inactive. Please contact the administrator.');
      }
      onLogin && onLogin({ user, accessToken, refreshToken, remember });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Call backend API to get Google authorization URL
      // The api.js request() function unwraps the response automatically
      const result = await authApi.getGoogleLoginUrl();

      console.log('Google OAuth response:', result);

      // Get authorization URL (api.js already unwrapped data.data)
      const authUrl = result?.authorizationUrl || result?.AuthorizationUrl;

      if (authUrl) {
        // Redirect to Google's authorization page
        window.location.href = authUrl;
      } else {
        console.error('No authorization URL in response:', result);
        throw new Error('Failed to get Google authorization URL from backend');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to initiate Google sign-in');
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

          <div className="divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="btn btn-google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
              <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

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


