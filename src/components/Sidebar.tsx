import React from 'react';
import { observer } from 'mobx-react-lite';
import Spotify from '../util/spotify';
import { Stack, Card, CardContent } from '@mui/material';
import { SpotifyPlaylist } from '../types/spotify';

interface SidebarProps {
    playlists: Array<SpotifyPlaylist>
}

const Sidebar: React.FC<SidebarProps> = observer((props) => {
    return(
        <Stack>
            {props.playlists.map((playlist) => (
                <Card key={playlist.id} style={{ marginBottom: '10px' }}>
                    <CardContent>
                        <h3>{playlist.name}</h3>
                    </CardContent>
                </Card>
            ))}
        </Stack>
    );
});

export default Sidebar;