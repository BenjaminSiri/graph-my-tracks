import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { useStores } from '../stores/RootStore';
import Spotify from '../util/spotify';
import { SpotifyTrack } from '../types/spotify';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components (REQUIRED)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StyledDiv = styled.div`
    width: 100%;
    height: calc(100% - 60px);
    padding: 20px;
`;

const Graph: React.FC = observer(() => {
    const { spotifyAuthStore } = useStores();
    const [tracks, setTracks] = useState<SpotifyTrack[]>([]);

    useEffect(() => {

        if (!spotifyAuthStore.selectedPlaylist && !spotifyAuthStore.selectedAlbum) {
            setTracks([]);
            return;
        }
        if (spotifyAuthStore.displayType === 'albums' && spotifyAuthStore.selectedAlbum) {
            Spotify.getAlbumTracks(spotifyAuthStore.selectedAlbum?.id).then((tracks) => {
                setTracks(tracks);
            });
            return;
        }
        if (spotifyAuthStore.displayType === 'playlists' && spotifyAuthStore.selectedPlaylist) {
            Spotify.getPlaylistTracks(spotifyAuthStore.selectedPlaylist?.id).then((tracks) => {
                setTracks(tracks);
            });
            return;
        }

    }, [spotifyAuthStore.selectedPlaylist, spotifyAuthStore.selectedAlbum]);

    const chartData = {
        labels: tracks.map((trackItem, index) => `Track ${index + 1}`),
        datasets: [{
            label: 'Track Duration (seconds)',
            data: tracks.map(trackItem => trackItem.duration_ms / 1000),
            borderColor: '#1DB954',
            backgroundColor: 'rgba(29, 185, 84, 0.1)',
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#1DB954',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Playlist Tracks Duration',
            },
            tooltip: {
                callbacks: {
                    title: (context: any) => {
                        const index = context[0].dataIndex;
                        return tracks[index]?.name || 'Unknown Track';
                    },
                    label: (context: any) => {
                        const seconds = context.parsed.y;
                        const minutes = Math.floor(seconds / 60);
                        const secs = Math.floor(seconds % 60);
                        return `Duration: ${minutes}:${secs.toString().padStart(2, '0')}`;
                    }
                }
            }
        },
    };

    return (
        <StyledDiv>
            
            {tracks.length > 0 && (
                <div style={{ width: '100%', marginBottom: '20px' }}>
                    <Line data={chartData} options={chartOptions} />
                </div>
            )}
            
        </StyledDiv>
    );
});

export default Graph;