// components/Login.tsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../stores/RootStore';
import Spotify from '../util/spotify';
import styled from 'styled-components';

const ButtonsDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 200px;
  margin-top: 20px;
`;

const Login: React.FC = observer(() => {
  const { spotifyAuthStore } = useStores();
  
  const handleLogin = async () => {
    try {
      await Spotify.redirectToAuthCodeFlow();
    } catch (error) {
      console.error('Failed to redirect to Spotify:', error);
    }
  };

const handleGuestLogin = async () => {
    try {
        await Spotify.getGuestAccessToken();
        spotifyAuthStore.setGuestMode(true); // Add this
        window.location.href = '/dashboard';
    } catch (error) {
        console.error('Failed to get guest access token:', error);
    }
};

  return (
    <div>
      <h1>Login to Spotify</h1>
      <ButtonsDiv>
        <button onClick={handleLogin}>
          Connect with Spotify
        </button>
        <button onClick={handleGuestLogin}>
          Continue as Guest
        </button>
      </ButtonsDiv>
    </div>
  );
});

export default Login;