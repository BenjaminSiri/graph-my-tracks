// pages/Callback.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Spotify from '../util/spotify';

function Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) {
      console.log('Skipping duplicate execution');
      return;
    }
    hasRun.current = true;

    const handleCallback = async () => {
      if (Spotify.hasValidToken()) {
        navigate('/dashboard', { replace: true });
        return;
      }

      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('Spotify auth error:', error);
        navigate('/login', { replace: true });
        return;
      }

      if (code) {
        try {
          console.log('Exchanging code for token...');
          await Spotify.getAccessToken(code);
          
          // Fetch user info
          await Spotify.getUserInfo();
          
          console.log('Successfully authenticated!');
          navigate('/dashboard', { replace: true }); // Changed from '/' to '/dashboard'
        } catch (error) {
          console.error('Failed to exchange code:', error);
          navigate('/login', { replace: true });
        }
      } else {
        console.log('No code in URL');
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <h2>Authenticating with Spotify...</h2>
      <p>Please wait while we log you in.</p>
    </div>
  );
}

export default Callback;