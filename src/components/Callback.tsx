// components/Callback.tsx
import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import Spotify from '../util/spotify';
import { useStores } from '../stores/RootStore';

const Callback: React.FC = observer(() => {
  const navigate = useNavigate();
  const { spotifyAuthStore } = useStores();
  const hasAttempted = useRef(false);

  useEffect(() => {
    // If we already have a valid token, just navigate to dashboard
    if (spotifyAuthStore.hasValidToken) {
      console.log('Already authenticated, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    // Prevent multiple attempts
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      console.error('Auth error:', error);
      spotifyAuthStore.setError(`Authentication failed: ${error}`);
      navigate('/login');
      return;
    }

    if (!code) {
      console.error('No code in URL');
      navigate('/login');
      return;
    }

    console.log('Exchanging code for token...');
    Spotify.getAccessToken(code)
      .then(() => {
        console.log('✅ Token saved to MobX successfully!');
        navigate('/dashboard');
      })
      .catch((error) => {
        console.error('❌ Token exchange failed:', error);
        // Don't navigate if we somehow got a token anyway
        if (spotifyAuthStore.hasValidToken) {
          console.log('But we have a valid token, navigating to dashboard');
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      });
  }, [navigate, spotifyAuthStore]);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      {spotifyAuthStore.isLoading ? (
        <div>
          <h2>🎵 Authenticating with Spotify...</h2>
          <p>Please wait while we complete your login.</p>
        </div>
      ) : spotifyAuthStore.error ? (
        <div>
          <h2>⚠️ Authentication Error</h2>
          <p style={{ color: 'red' }}>{spotifyAuthStore.error}</p>
          <button 
            onClick={() => navigate('/login')}
            style={{ marginTop: '20px', padding: '10px 20px' }}
          >
            Try Again
          </button>
        </div>
      ) : (
        <p>Processing authentication...</p>
      )}
    </div>
  );
});

export default Callback;