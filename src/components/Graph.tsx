import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { useStores } from '../stores/RootStore';
import Spotify from '../util/spotify';

const StyledDiv = styled.div`
    border: 1px solid #ccc;
    width: 100%;
    height: 100%;
`;


const Graph: React.FC = observer(() => {
    const { spotifyAuthStore } = useStores();
    const [tracks, setTracks] = useState<any[]>([]);


    useEffect(() => {
        if (!spotifyAuthStore.selectedPlaylist) {
            return;
        }
        Spotify.getPlaylistTracks(spotifyAuthStore.selectedPlaylist?.id).then((tracks) => {
            setTracks(tracks);
            console.log(`Tracks for playlist ${spotifyAuthStore.selectedPlaylist?.name}:`, tracks);
        });


    }, [spotifyAuthStore.selectedPlaylist]);


    return (
        <StyledDiv>
            <p>{spotifyAuthStore.selectedPlaylist ? spotifyAuthStore.selectedPlaylist.name : 'Select a playlist'}</p>
            {tracks.map((trackItem, index) => (
                <p key={index} >{trackItem.track.name}</p>
            ))}
        </StyledDiv>
    );
});

export default Graph;