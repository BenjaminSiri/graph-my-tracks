// components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import Spotify from '../util/spotify';
import Sidebar from '../components/Sidebar';
import { observer } from 'mobx-react-lite';
import { useStores } from '../stores/RootStore';
import { SpotifyPlaylist } from '../types/spotify';

const Dashboard: React.FC = observer(() => {
  const { spotifyAuthStore } = useStores();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Wait for user info to be available
      if (!spotifyAuthStore.userInfo) {
        console.log('Waiting for user info...');
        await Spotify.getUserInfo();
      }

      // Now fetch playlists
      if (spotifyAuthStore.userInfo) {
        setIsLoading(true);
        try {
          const userPlaylists = await Spotify.getUserPlaylists();
          setPlaylists(userPlaylists);
        } catch (error) {
          console.error('Failed to fetch playlists:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [spotifyAuthStore.userInfo]);

  const handleFetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const userPlaylists = await Spotify.getUserPlaylists();
      setPlaylists(userPlaylists);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!spotifyAuthStore.userInfo) {
    return <div>Loading user data...</div>;
  }

  return (
    <div>
      <button onClick={handleFetchPlaylists} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Refresh Playlists'}
      </button>
      {isLoading && <p>Loading playlists...</p>}
      <Sidebar playlists={playlists} />
    </div>
  );
});

export default Dashboard;