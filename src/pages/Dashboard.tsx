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
  padding: 1rem;
  box-sizing: border-box;
  gap: 1rem;

`;

const MainViewDiv = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  flex-grow: 1;
  overflow-y: auto;
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

    if(!spotifyAuthStore.isGuest) {
      const fetchPlaylists = async () => {
        hasFetchedPlaylists.current = true;
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
      spotifyAuthStore.setDisplayType('playlists');
      fetchPlaylists();
    } else {
      const fetchAlbums = async () => {
        setIsLoading(true);
        try {
          const albums = await Spotify.getAlbums();
          spotifyAuthStore.setAlbums(albums);
        } catch (error) {
          console.error('Failed to fetch albums:', error);
        } finally {
          setIsLoading(false);
        }
      };
      spotifyAuthStore.setDisplayType('albums');
      fetchAlbums();
    }
  }, [spotifyAuthStore.userInfo, spotifyAuthStore]);

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
        {isLoading ? (
          <p>Loading playlists...</p>
        ) : (
          <>
          {!spotifyAuthStore.isGuest ? (
            <Sidebar playlists={spotifyAuthStore.playlists} />
          ) : (
            <Sidebar playlists={spotifyAuthStore.albums} />
          )}
        </>
        )}
      </div>
      <MainViewDiv>
        <p>Controls and downloads</p>
        <Graph />
      </MainViewDiv>
    </DashboardDiv>
  );
});

export default Dashboard;