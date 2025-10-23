import React, { useEffect, useState } from 'react';
import { AdminDashboard, LecturerDashboard } from './dashboard';
import { Login, Home } from './features';
import { Register, GoogleCallback } from './features/authentication';
import { authApi } from './api';
import { RolesProvider } from './contexts/RolesContext';
// styles moved to global.css

function App() {
  const [auth, setAuth] = useState(null);
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [booting, setBooting] = useState(true);

  const handleLoggedIn = (payload) => {
    const { user, accessToken, refreshToken, remember } = payload;
    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem('accessToken', accessToken);
    storage.setItem('refreshToken', refreshToken);
    storage.setItem('user', JSON.stringify(user));
    setAuth({ user, accessToken, refreshToken });
  };

  const isAdmin = auth?.user?.roles?.includes('Admin');
  const isLecturer = auth?.user?.roles?.includes('Lecturer') || auth?.user?.roles?.includes('Teacher');
  
  useEffect(() => {
    // Try bootstrapping from storage
    const accessToken = window.localStorage.getItem('accessToken') || window.sessionStorage.getItem('accessToken');
    const refreshToken = window.localStorage.getItem('refreshToken') || window.sessionStorage.getItem('refreshToken');
    const savedUser = window.localStorage.getItem('user') || window.sessionStorage.getItem('user');
    (async () => {
      try {
        let user = savedUser ? JSON.parse(savedUser) : null;
        if (!user && (accessToken || refreshToken)) {
          // fetch current user via /me (will auto refresh if needed)
          const me = await authApi.me();
          user = me?.user || me?.User || me || null;
          const storage = window.localStorage.getItem('refreshToken') ? window.localStorage : window.sessionStorage;
          if (user) storage.setItem('user', JSON.stringify(user));
        }
        if (user) setAuth({ user, accessToken, refreshToken });
      } catch (_e) {
        // ignore
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // Check if we're on the Google OAuth callback route
  const isGoogleCallback = window.location.pathname === '/auth/google/callback' ||
                           window.location.search.includes('code=');

  if (booting) return null;
  if (isAdmin) return (
    <RolesProvider>
      <AdminDashboard user={auth.user} />
    </RolesProvider>
  );
  if (isLecturer) return (
    <RolesProvider>
      <LecturerDashboard user={auth.user} />
    </RolesProvider>
  );
  if (auth) return <Home user={auth.user} />;

  // Handle Google OAuth callback
  if (isGoogleCallback) {
    return (
      <div className="App">
        <GoogleCallback onLogin={handleLoggedIn} />
      </div>
    );
  }

  return (
    <RolesProvider>
      <div className="App">
        {mode === 'login' ? (
          <Login onLogin={handleLoggedIn} onSwitchToRegister={() => setMode('register')} />
        ) : (
          <Register
            onSwitchToLogin={() => setMode('login')}
          />
        )}
      </div>
    </RolesProvider>
  );
}

export default App;