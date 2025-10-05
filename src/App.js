import React, { useState } from 'react';
import { AdminDashboard, Login, Home } from './features';
import { Register } from './features/authentication';
// styles moved to global.css

function App() {
  const [auth, setAuth] = useState(null);
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  const handleLoggedIn = (payload) => {
    const { user, accessToken, refreshToken, remember } = payload;
    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem('accessToken', accessToken);
    storage.setItem('refreshToken', refreshToken);
    storage.setItem('user', JSON.stringify(user));
    setAuth({ user, accessToken, refreshToken });
  };

  const isAdmin = auth?.user?.roles?.includes('Admin');
  if (isAdmin) return <AdminDashboard />;
  if (auth) return <Home />;

  return (
    <div className="App">
      {mode === 'login' ? (
        <Login onLogin={handleLoggedIn} onSwitchToRegister={() => setMode('register')} />
      ) : (
        <Register
          onRegistered={({ user, accessToken, refreshToken }) => {
            // auto-login sau khi đăng ký
            const storage = window.localStorage;
            storage.setItem('accessToken', accessToken);
            storage.setItem('refreshToken', refreshToken);
            storage.setItem('user', JSON.stringify(user));
            setAuth({ user, accessToken, refreshToken });
          }}
          onSwitchToLogin={() => setMode('login')}
        />
      )}
    </div>
  );
}

export default App;
