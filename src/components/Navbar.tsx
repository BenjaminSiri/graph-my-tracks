import React, { useEffect, useRef } from 'react';
import styled from "styled-components";
import { observer } from 'mobx-react-lite';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStores } from '../stores/RootStore';
import Spotify from '../util/spotify';

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
    width: 50px;
    height: 50px;
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

        // Only fetch if we don't have user info yet
        if (!spotifyAuthStore.userInfo && !spotifyAuthStore.isGuest && !hasAttemptedFetch.current) {
            hasAttemptedFetch.current = true;
            Spotify.getUserInfo()
                .then(userInfo => {
                    spotifyAuthStore.setUserInfo(userInfo);
                })
                .catch(error => {
                    console.error('Failed to fetch user info:', error);
                    spotifyAuthStore.setGuestMode(true); // This now sets guest info automatically
                });
        }
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
                        <p  style={{ color: '#1DB954' }}>No Profile Image</p>
                    )}
                </ProfileButton>
            ) : (
                <p style={{ color: '#1DB954' }}>Loading user...</p>
            )}
        </StyledNavbar>
    );
});

export default Navbar;