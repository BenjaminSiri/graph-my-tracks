import React, { useEffect, useRef } from 'react';
import styled from "styled-components";
import { observer } from 'mobx-react-lite';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStores } from '../stores/RootStore';
import Spotify from '../util/spotify';

import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';

const StyledNavbar = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    border-bottom: 2px solid #1DB954;
    justify-content: space-between;
    align-items: center;
    height: 60px;
    padding: 0 20px;
`;

const ProfileButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
`;

const ProfileImage = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 50%;
`;

const Navbar: React.FC = observer(() => {
    const navigate = useNavigate();
    const location = useLocation();
    const { spotifyAuthStore } = useStores();
    const hasAttemptedFetch = useRef(false);

    useEffect(() => {
        // Don't redirect if we're on callback or login page
        if (location.pathname === '/callback' || location.pathname === '/login') {
            return;
        }

        if (!spotifyAuthStore.hasValidToken) {
            console.log('No valid token, redirecting to login');
            navigate('/login');
            return;
        }

        // Skip if guest or already have user info or already attempted
        if (spotifyAuthStore.isGuest || spotifyAuthStore.userInfo || hasAttemptedFetch.current) {
            return;
        }

        // Only authenticated users need to fetch user info
        hasAttemptedFetch.current = true;
        Spotify.getUserInfo()
            .then(userInfo => {
                spotifyAuthStore.setUserInfo(userInfo);
            })
            .catch(error => {
                console.error('Failed to fetch user info:', error);
                // If fetch fails, treat as guest
                spotifyAuthStore.setGuestMode(true);
            });
    }, [spotifyAuthStore.hasValidToken, spotifyAuthStore.userInfo, spotifyAuthStore.isGuest, navigate, location.pathname]);

    const handleLogout = () => {
        Spotify.logout();
        navigate('/login');
    };

    return (
        <StyledNavbar>
            <h2>Graph my Tracks</h2>
            {spotifyAuthStore.userInfo ? (
                <ProfileButton onClick={handleLogout}>
                    {(spotifyAuthStore.userInfo.images && spotifyAuthStore.userInfo.images.length > 0) ? (
                        <ProfileImage 
                            src={spotifyAuthStore.userInfo.images[0].url} 
                            alt="Profile" 
                        />
                    ) : (
                        <AccountCircleOutlinedIcon style={{ fontSize: 50, color: '#1DB954' }} />
                    )}
                </ProfileButton>
            ) : (
                <AccountCircleOutlinedIcon style={{ fontSize: 50, color: '#1DB954' }} />
            )}
        </StyledNavbar>
    );
});

export default Navbar;