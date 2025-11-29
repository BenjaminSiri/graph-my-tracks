// components/Dashboard.tsx
import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { useStores } from '../stores/RootStore';
import Spotify from '../util/spotify';

const Dashboard: React.FC = observer(() => {
  const navigate = useNavigate();
  const { spotifyAuthStore } = useStores();

  useEffect(() => {
    if (!spotifyAuthStore.hasValidToken) {
      console.log('No valid token, redirecting to login');
      navigate('/login');
      return;
    }

    // Fetch user info if we don't have it yet
    if (!spotifyAuthStore.userInfo && !spotifyAuthStore.isLoading) {
      console.log('Fetching user info...');
      Spotify.getUserInfo().catch((error) => {
        console.error('Failed to fetch user info:', error);
      });
    }
  }, [spotifyAuthStore.hasValidToken, spotifyAuthStore.userInfo, spotifyAuthStore.isLoading, navigate]);

  if (!spotifyAuthStore.hasValidToken) {
    return <div>Redirecting to login...</div>;
  }

  const handleLogout = () => {
    Spotify.logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1>🎵 Spotify Dashboard</h1>
      
      {spotifyAuthStore.isLoading && <p>Loading...</p>}
      
      {spotifyAuthStore.error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '20px' }}>
          Error: {spotifyAuthStore.error}
        </div>
      )}
      
      {spotifyAuthStore.userInfo ? (
        <div>
          <h2>Welcome, {spotifyAuthStore.userInfo.display_name}! 👋</h2>
          
          {spotifyAuthStore.userInfo.images.length > 0 && (
            <img 
              src={spotifyAuthStore.userInfo.images[0].url} 
              alt="Profile" 
              style={{ width: '150px', height: '150px', borderRadius: '50%', marginTop: '20px' }}
            />
          )}
          
          <div style={{ marginTop: '20px' }}>
            <p><strong>Spotify ID:</strong> {spotifyAuthStore.userInfo.id}</p>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <p><strong>Token expires in:</strong> {spotifyAuthStore.timeUntilExpiration} minutes</p>
          </div>
        </div>
      ) : (
        <p>Loading user information...</p>
      )}
      <h1>Charts</h1>
      <button 
        onClick={handleLogout}
        style={{ 
          marginTop: '30px', 
          padding: '10px 20px',
          backgroundColor: '#1DB954',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  );
});

export default Dashboard;