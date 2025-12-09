// components/Dashboard.tsx
import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { useStores } from '../stores/RootStore';
import Spotify from '../util/spotify';

const Dashboard: React.FC = observer(() => {
  const navigate = useNavigate();
  const { spotifyAuthStore } = useStores();


  return (
    <div style={{ padding: '40px' }}>
      <h1>🎵 Spotify Dashboard</h1>
    </div>
  );
});

export default Dashboard;
