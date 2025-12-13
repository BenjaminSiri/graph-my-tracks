import React from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { useStores } from '../stores/RootStore';

const StyledDiv = styled.div`
    border: 1px solid #ccc;
    width: 100%;
    height: 100%;
`;


const Graph: React.FC = observer(() => {
    const { spotifyAuthStore } = useStores();


    return (
        <StyledDiv>
            <p>{spotifyAuthStore.selectedPlaylist ? spotifyAuthStore.selectedPlaylist.name : 'Select a playlist'}</p>
        </StyledDiv>
    );
});

export default Graph;