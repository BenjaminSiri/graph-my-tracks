import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../stores/RootStore';
import { Stack, Card, CardContent, CardActionArea } from '@mui/material';
import { SpotifyPlaylist } from '../types/spotify';
import styled from 'styled-components';

const StyledCard = styled(Card)`
    height: 60px;
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    cursor: pointer;
    
    &:hover {
        background-color: #f5f5f5;
    }
`;

const StyledCardContent = styled(CardContent)`
    padding: 8px !important;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    background-color: var(--spotify-green);
`;

const PlaylistImage = styled.img`
    width: 44px;
    height: 44px;
    object-fit: cover;
    border-radius: 4px;
    flex-shrink: 0;
`;

const PlaylistName = styled.h3`
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--background);
`;

const StyledStack = styled(Stack)`
    width: 100%;
    min-width: 200px;
    max-width: 300px;
`;

const PlaceholderImage = styled.div`
    width: 44px;
    height: 44px;
    background-color: #1DB954;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    flex-shrink: 0;
`;

interface SidebarProps {
    playlists: Array<SpotifyPlaylist>
}

const Sidebar: React.FC<SidebarProps> = observer((props) => {
    const { spotifyAuthStore } = useStores();
    
    const handlePlaylistClick = (playlistId: string) => {
        spotifyAuthStore.setSelectedPlaylist(playlistId);
    }

    return(
        <StyledStack>
            {props.playlists.map((playlist) => (
                <StyledCard key={playlist.id}>
                    <CardActionArea onClick={() => handlePlaylistClick(playlist.id)}>
                        <StyledCardContent>
                            {playlist.images && playlist.images.length > 0 && playlist.images[0]?.url ? (
                                <PlaylistImage 
                                    src={playlist.images[0].url} 
                                    alt={playlist.name}
                                />
                            ) : (
                                <PlaceholderImage>
                                    {playlist.name.charAt(0).toUpperCase()}
                                </PlaceholderImage>
                            )}
                            <PlaylistName>{playlist.name}</PlaylistName>
                        </StyledCardContent>
                    </CardActionArea>
                </StyledCard>
            ))}
        </StyledStack>
    );
});

export default Sidebar;