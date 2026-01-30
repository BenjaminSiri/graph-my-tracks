// components/Login.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Divider } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useStores } from '../stores/RootStore';
import Spotify from '../util/spotify';
import styled from 'styled-components';
import SpotifyLogo from '../img/spotify-logo.png';
import LoginBackground from '../components/LoginBackground';

const LoginDiv = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin-top: 50px;
`

const ModalDiv = styled.div`
  z-index: 1;
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 400px;
  min-height: 500px;
  background-color: var(--spotify-green);
  color: black;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  gap: 20px;
`;

const StyledButton = styled(Button)`
&& {
  width: 250px;
  height: 50px;
  font-size: 16px;
  border-radius: 25px;
  text-transform: none;
  cursor: pointer;
  background-color: var(--background);
  color: white;
  font-weight: bold;
  text-size: 14px;
}

&&.MuiButton-outlined {
  border: 3px solid black;
  color: black;
  background-color: transparent;

  &:hover {
    background-color: #f5f5f5;
  }
}

&:hover {
  background-color: #333333;
}
`

const StyledDivider = styled(Divider)`
  width: 100%;
  background-color: var(--background);
  height: 3px;
`

const StyledText = styled.p`
  color: black;
  text-align: center;
  font-weight: 500;
  font-spacing: 1px;
  width: 100%;
`

const Login: React.FC = observer(() => {
  const { spotifyAuthStore } = useStores();
  const navigate = useNavigate();

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
        spotifyAuthStore.setGuestMode(true);
        navigate('/dashboard'); // Use navigate instead of window.location.href
    } catch (error) {
        console.error('Failed to get guest access token:', error);
    }
};

  return (
    <LoginDiv>
      <LoginBackground />
      <ModalDiv>
        <h1>Chart My Tracks</h1>
        <StyledDivider />
        <StyledText>
          With Chart My Tracks, you can visualize your Spotify
          listening habits through a variety of interactive charts
          and graphs.
        </StyledText>
        <img src={SpotifyLogo} alt="Spotify Logo" style={{ width: '150px', height: '150px' }} />
        <StyledButton onClick={handleGuestLogin}>
          Continue as Guest
        </StyledButton>
        <StyledText>
          Spotify login for all users is on the way!
        </StyledText>
        <StyledButton onClick={handleLogin} variant="outlined">
          Dev Login with Spotify
        </StyledButton>
      </ModalDiv>
    </LoginDiv>
  );
});

export default Login;