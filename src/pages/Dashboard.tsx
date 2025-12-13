// components/Dashboard.tsx
import React, { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../stores/RootStore';
import Spotify from '../util/spotify';
import styled from 'styled-components';

import Graph from '../components/Graph';
import Sidebar from '../components/Sidebar';

const DashboardDiv = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100vh - 60px);
  width: 100vw;
  background-color: #f0f2f5;
  padding: 1rem;
  box-sizing: border-box;
  gap: 1rem;

`;

const StyledButton = styled.button<{ $isLoading: boolean }>`
  padding: 0.5rem 1rem;
  cursor: ${props => props.$isLoading ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$isLoading ? 0.6 : 1};
  width: 100%;
  margin-bottom: 10px;
`;



const Dashboard: React.FC = observer(() => {
  const { spotifyAuthStore } = useStores();
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
    <DashboardDiv>
      <div>
        <StyledButton 
          onClick={handleRefreshPlaylists} 
          disabled={isLoading}
          $isLoading={isLoading} 
        >
          {isLoading ? 'Loading...' : 'Refresh Playlists'}
        </StyledButton >
      
        {isLoading ?
          <p>Loading playlists...</p>
          :
          <Sidebar playlists={spotifyAuthStore.playlists} />
        }
      </div>
      <Graph />
    </DashboardDiv>
  );
});

export default Dashboard;