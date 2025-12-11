// components/Dashboard.tsx
import React, { useEffect, useState, useRef } from 'react';
import Spotify from '../util/spotify';
import Sidebar from '../components/Sidebar';
import { observer } from 'mobx-react-lite';
import { useStores } from '../stores/RootStore';

const Dashboard: React.FC = observer(() => {
  const { spotifyAuthStore } = useStores();
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedPlaylists = useRef(false);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedPlaylists.current || !spotifyAuthStore.userInfo) {
      return;
    }

    const fetchPlaylists = async () => {
      hasFetchedPlaylists.current = true;
      setIsLoading(true);
      try {
        const userPlaylists = await Spotify.getUserPlaylists();
        spotifyAuthStore.setPlaylists(userPlaylists);
        console.log('Playlists fetched:', userPlaylists);
      } catch (error) {
        console.error('Failed to fetch playlists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, [spotifyAuthStore.userInfo, spotifyAuthStore]);

  const handleRefreshPlaylists = async () => {
    setIsLoading(true);
    try {
      const userPlaylists = await Spotify.getUserPlaylists();
      spotifyAuthStore.setPlaylists(userPlaylists);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!spotifyAuthStore.userInfo) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={handleRefreshPlaylists} 
          disabled={isLoading}
          style={{
            padding: '0.5rem 1rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? 'Loading...' : 'Refresh Playlists'}
        </button>
      </div>
      
      {isLoading ?
        <p>Loading playlists...</p>
        :
        <Sidebar playlists={spotifyAuthStore.playlists} />
      }
      
      {!isLoading && spotifyAuthStore.playlists.length === 0 && (
        <p>No playlists found.</p>
      )}
    </div>
  );
});

export default Dashboard;