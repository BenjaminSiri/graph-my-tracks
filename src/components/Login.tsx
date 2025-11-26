// components/Login.tsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import Spotify from '../util/spotify';

const Login: React.FC = observer(() => {
  const handleLogin = async () => {
    try {
      await Spotify.redirectToAuthCodeFlow();
    } catch (error) {
      console.error('Failed to redirect to Spotify:', error);
    }
  };

  return (
    <div>
      <h1>Login to Spotify</h1>
      <button onClick={handleLogin}>
        Connect with Spotify
      </button>
    </div>
  );
});

export default Login;