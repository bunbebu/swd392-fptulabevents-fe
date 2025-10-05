import React, { useState } from 'react';
// styles moved to global.css
import { register as apiRegister } from './api';

function Register({ onRegistered, onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [mssv, setMssv] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { user, accessToken, refreshToken } = await apiRegister({ email, username, password, fullname, mssv });
      const toastMsg = 'Your account has been created successfully. Please sign in to continue.';
      setSuccess(toastMsg);
      onRegistered && onRegistered({ user, accessToken, refreshToken });
      setTimeout(() => {
        onSwitchToLogin && onSwitchToLogin();
      }, 2000);
    } catch (err) {
      const isObject = (v) => v && typeof v === 'object';
      const details = isObject(err?.details) ? err.details : (isObject(err?.data) ? err.data : null);
      setFieldErrors(details);
      const msg = err?.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page register-page">
      <div className="login-left">
        <div className="left-overlay-grid" />
        <div className="left-ornament left-ornament--one" />
        <div className="left-ornament left-ornament--two" />
        <div className="brand-row">
          <div className="brand-badge">FL</div>
          <h1 className="brand-name">FPTU Lab Events</h1>
        </div>
        <div className="left-content">
          <h2 className="headline">Create your account</h2>
          <p className="subhead">Register to use the Lab Events platform</p>
        </div>
        <div className="footer-note">© {new Date().getFullYear()} FPTU Lab Events</div>
      </div>

      <div className="login-right">
        <div className="panel">
          <div className="panel-header">
            <h2>Sign Up</h2>
            <p>Create a new account</p>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email<span className="required-asterisk" aria-hidden>*</span></label>
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
              <label htmlFor="username">Username<span className="required-asterisk" aria-hidden>*</span></label>
              <div className="input-wrap">
              <span className="input-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="7" r="4"/>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                </svg>
              </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="fullname">Full name</label>
              <div className="input-wrap">
              <span className="input-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="7" r="4"/>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                </svg>
              </span>
                <input
                  id="fullname"
                  name="fullname"
                  type="text"
                  placeholder="Full name"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="mssv">Student ID</label>
              <div className="input-wrap">
              <span className="input-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" ry="2"/>
                  <path d="M7 9h10M7 13h6"/>
                </svg>
              </span>
                <input
                  id="mssv"
                  name="mssv"
                  type="text"
                  placeholder="Student ID"
                  value={mssv}
                  onChange={(e) => setMssv(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password<span className="required-asterisk" aria-hidden>*</span></label>
              <div className="input-wrap">
              <span className="input-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2"/>
                  <path d="M7 11V8a5 5 0 0 1 10 0v3"/>
                </svg>
              </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password<span className="required-asterisk" aria-hidden>*</span></label>
              <div className="input-wrap">
              <span className="input-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2"/>
                  <path d="M7 11V8a5 5 0 0 1 10 0v3"/>
                  <path d="M10 17l2 2 4-4"/>
                </svg>
              </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {success && (
              <div
                className="success-text"
                role="status"
                style={{
                  color: '#0f5132',
                  background: '#e7f7ee',
                  border: '1px solid #b7f0d1',
                  padding: 10,
                  borderRadius: 8,
                  fontStyle: 'italic',
                  fontSize: '0.9rem'
                }}
              >
                {success}
              </div>
            )}
            {error && (
              <div className="error-text" role="alert">{error}</div>
            )}
            {fieldErrors && (
              <div className="error-text" role="alert" style={{ marginTop: 8 }}>
                {Array.isArray(fieldErrors) ? (
                  <ul>
                    {fieldErrors.map((e, i) => (
                      <li key={i}>{typeof e === 'string' ? e : JSON.stringify(e)}</li>
                    ))}
                  </ul>
                ) : (
                  <ul>
                    {Object.entries(fieldErrors).map(([k, v]) => (
                      <li key={k}><strong>{k}:</strong> {Array.isArray(v) ? v.join(', ') : (typeof v === 'string' ? v : JSON.stringify(v))}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing up…' : 'Sign Up'}
            </button>
          </form>

          <div className="form-footer">
            <span>Already have an account?</span>
            <button type="button" className="link" onClick={onSwitchToLogin}>Sign In</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;


