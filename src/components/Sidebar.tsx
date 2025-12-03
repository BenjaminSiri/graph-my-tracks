import React from 'react';
import { observer } from 'mobx-react-lite';
import Spotify from '../util/spotify';

const Sidebar: React.FC = observer(() => {
    return(
        <div>
            <h1>Spotify Dashboard</h1>
            <p>This is a placeholder for the Dashboard page.</p>
        </div>
    );
});

export default Sidebar;