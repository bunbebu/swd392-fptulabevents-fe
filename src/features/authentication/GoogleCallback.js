import React, { useEffect, useState } from 'react';
import { authApi } from '../../api';

function GoogleCallback({ onLogin }) {
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const errorParam = urlParams.get('error');

        if (errorParam) {
          throw new Error(`Google authentication failed: ${errorParam}`);
        }

        if (!code) {
          throw new Error('No authorization code received from Google');
        }

        // Exchange the code for tokens
        const { user, accessToken, refreshToken } = await authApi.handleGoogleCallback(code, state);
        
        if (!accessToken || !user) {
          throw new Error('Invalid response from server');
        }

        // Check user status
        const status = (user.status || user.Status || '').toString().toLowerCase();
        if (status && status !== 'active') {
          throw new Error('Your account is inactive. Please contact the administrator.');
        }

        // Call the onLogin callback with remember=true for Google logins
        onLogin && onLogin({ user, accessToken, refreshToken, remember: true });
      } catch (err) {
        console.error('Google callback error:', err);
        setError(err.message || 'Failed to complete Google sign-in');
        setProcessing(false);
      }
    };

    handleCallback();
  }, [onLogin]);

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
        </div>
        <div className="footer-note">© {new Date().getFullYear()} FPTU Lab Events</div>
      </div>

      <div className="login-right">
        <div className="panel">
          <div className="panel-header">
            <h2>{processing ? 'Completing Sign In...' : 'Sign In Failed'}</h2>
            <p>{processing ? 'Please wait while we complete your Google sign-in' : 'There was a problem signing you in'}</p>
          </div>

          <div className="form" style={{ textAlign: 'center', padding: '2rem 0' }}>
            {processing ? (
              <div className="spinner" aria-label="Loading">
                <div className="spinner-circle"></div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="error-text" role="alert" style={{ marginBottom: '1.5rem' }}>
                    {error}
                  </div>
                )}
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/'}
                >
                  Return to Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoogleCallback;

