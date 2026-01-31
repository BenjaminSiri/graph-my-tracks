import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../stores/RootStore';
import styled from 'styled-components';
import IconButton from '@mui/material/IconButton';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';

const ControlsDiv = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 6px 20px;
`;

const StyledIconButton = styled(IconButton)`
  && {
    font-size: 16px;
    border-radius: 25px;
    text-transform: none;
    cursor: pointer;
    background-color: var(--spotify-green);
    color: white;
    font-weight: bold;
    text-size: 14px;
    border: 3px solid var(--spotify-green);
  }
`;

const Controls: React.FC = observer(() => {
  const { spotifyAuthStore } = useStores();

  return (
    <ControlsDiv>
        <StyledIconButton>
            <TuneIcon />
        </StyledIconButton>
        <StyledIconButton>
            <DownloadIcon />
        </StyledIconButton>
    </ControlsDiv>
  )
});

export default Controls;