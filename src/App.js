import React, { useState } from 'react';
import './App.css';
import ChatApp from './Components/ChatApp';
import Login from './Components/Login/Login';

function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userInfo) => {
    setUser(userInfo);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <>
      {user ? (
        <ChatApp onLogout={handleLogout} currentUser={user} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

export default App;

