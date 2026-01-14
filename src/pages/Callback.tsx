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
    // If already authenticated, go to dashboard
    if (spotifyAuthStore.hasValidToken) {
      console.log('Already authenticated, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    // Prevent double execution in React Strict Mode
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    // Handle error from Spotify
    if (error) {
      console.error('❌ Spotify auth error:', error);
      spotifyAuthStore.setError(`Authentication failed: ${error}`);
      navigate('/login');
      return;
    }

    // Validate we have required parameters
    if (!code) {
      console.error('❌ No authorization code in URL');
      spotifyAuthStore.setError('Missing authorization code');
      navigate('/login');
      return;
    }

    if (!state) {
      console.error('❌ No state parameter in URL');
      spotifyAuthStore.setError('Missing state parameter');
      navigate('/login');
      return;
    }

    console.log('🔄 Exchanging code for token...');
    
    // Exchange code for access token
    Spotify.getAccessToken(code, state)
      .then(() => {
        console.log('Token saved to MobX successfully!');
        navigate('/dashboard');
      })
      .catch((error) => {
        console.error('❌ Token exchange failed:', error);
        
        // If we somehow got a token anyway, proceed to dashboard
        if (spotifyAuthStore.hasValidToken) {
          console.log('Token exists despite error, proceeding to dashboard');
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      });
  }, [navigate, spotifyAuthStore]);

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {spotifyAuthStore.isLoading ? (
        <div>
          <h2>🎵 Authenticating with Spotify...</h2>
          <p>Please wait while we complete your login.</p>
          <div style={{ marginTop: '20px' }}>
            <div className="spinner">⏳</div>
          </div>
        </div>
      ) : spotifyAuthStore.error ? (
        <div>
          <h2>⚠️ Authentication Error</h2>
          <p style={{ color: 'red', margin: '20px 0' }}>
            {spotifyAuthStore.error}
          </p>
          <button 
            onClick={() => {
              spotifyAuthStore.setError(null);
              navigate('/login');
            }}
            style={{ 
              marginTop: '20px', 
              padding: '12px 24px',
              backgroundColor: '#1DB954',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Try Again
          </button>
        </div>
      ) : (
        <div>
          <h2>Processing authentication...</h2>
          <p>You'll be redirected shortly.</p>
        </div>
      )}
    </div>
  );
});

export default Callback;