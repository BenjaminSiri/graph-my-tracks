// spotify.ts
import { SpotifyPlaylist } from '../types/spotify';
import SpotifyAuthStore from '../stores/SpotifyAuthStore';

const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
const redirectUri = process.env.REACT_APP_REDIRECT_URI || 'http://127.0.0.1:3000/callback';
const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || '';

// PKCE helper functions
function generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input: ArrayBuffer): string {
    return btoa(String.fromCharCode(...Array.from(new Uint8Array(input))))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

const Spotify = {
    // Step 1: Redirect to Spotify authorization
    async redirectToAuthCodeFlow(): Promise<void> {
        const verifier = generateRandomString(64);
        const hashed = await sha256(verifier);
        const challenge = base64encode(hashed);

        // Encode verifier in state parameter - Spotify will return it unchanged
        const state = btoa(JSON.stringify({ 
            verifier,
            timestamp: Date.now() // Optional: for debugging
        }));

        const params = new URLSearchParams({
            client_id: clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            scope: 'user-top-read playlist-read-private playlist-read-collaborative',
            code_challenge_method: 'S256',
            code_challenge: challenge,
            state: state, // Pass verifier through state
        });

        console.log('Redirecting to Spotify with redirect_uri:', redirectUri);
        console.log('Verifier embedded in state parameter');
        
        window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    },

    async getGuestAccessToken(): Promise<string> {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await response.json();
        SpotifyAuthStore.setToken(data.access_token, data.expires_in);
        return data.access_token;
    },

    // Step 2: Exchange code for access token (now takes state parameter)
    async getAccessToken(code: string, state: string): Promise<string> {
        SpotifyAuthStore.setLoading(true);
        SpotifyAuthStore.setError(null);

        let verifier: string;
        
        try {
            // Extract verifier from state parameter
            const stateData = JSON.parse(atob(state));
            verifier = stateData.verifier;
            
            console.log('Verifier extracted from state parameter');
            console.log('State timestamp:', new Date(stateData.timestamp).toISOString());
            
            if (!verifier) {
                throw new Error('Verifier not found in state parameter');
            }
        } catch (error) {
            const errorMsg = 'Failed to retrieve verifier from state parameter';
            console.error(errorMsg, error);
            SpotifyAuthStore.setError(errorMsg);
            SpotifyAuthStore.setLoading(false);
            throw new Error(errorMsg);
        }

        const params = new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            code_verifier: verifier,
        });

        console.log('Token exchange request:', {
            client_id: clientId,
            redirect_uri: redirectUri,
            code: code.substring(0, 10) + '...',
            has_verifier: !!verifier,
            verifier_length: verifier.length
        });

        try {
            const result = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            const data = await result.json();
            
            console.log('Token exchange response status:', result.status);
            
            if (data.access_token) {
                // Store in MobX store
                SpotifyAuthStore.setToken(data.access_token, data.expires_in);
                console.log('Successfully obtained access token and saved to MobX');
                SpotifyAuthStore.setLoading(false);
                return data.access_token;
            } else {
                const errorMsg = data.error_description || data.error || 'Failed to get access token';
                console.error('Token exchange failed:', errorMsg, data);
                SpotifyAuthStore.setError(errorMsg);
                SpotifyAuthStore.setLoading(false);
                throw new Error(errorMsg);
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Token exchange error:', error);
            SpotifyAuthStore.setError(errorMsg);
            SpotifyAuthStore.setLoading(false);
            throw error;
        }
    },

    // Check if we have a valid token
    hasValidToken(): boolean {
        return SpotifyAuthStore.hasValidToken;
    },

    // Get the current access token
    getCurrentToken(): string {
        return SpotifyAuthStore.accessToken;
    },

    // Fetch user profile
    async getUserInfo() {
        if (!this.hasValidToken()) {
            return null;
        }

        SpotifyAuthStore.setLoading(true);

        try {
            const response = await fetch('https://api.spotify.com/v1/me', {
                headers: { Authorization: `Bearer ${SpotifyAuthStore.accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch user info: ${response.status}`);
            }

            const data = await response.json();
            SpotifyAuthStore.setUserInfo(data);
            return data;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch user info';
            console.error('Error fetching user info:', error);
            SpotifyAuthStore.setError(errorMsg);
            throw error;
        } finally {
            SpotifyAuthStore.setLoading(false);
        }
    },

    // fetch user's playlists
    async getUserPlaylists(): Promise<SpotifyPlaylist[]> {
        if (!SpotifyAuthStore.hasValidToken) {
            return [];
        }

        if (!SpotifyAuthStore.userInfo) {
            console.error('User info not available');
            return [];
        }

        try {
            const response = await fetch(
                `https://api.spotify.com/v1/users/${SpotifyAuthStore.userInfo.id}/playlists?limit=50`,
                {
                    headers: { Authorization: `Bearer ${SpotifyAuthStore.accessToken}` }
                }
            );

            if (!response.ok) {
                console.error(`Failed to fetch user's playlists: ${response.status}`);
                return [];
            }

            const jsonResponse = await response.json();

            if (!jsonResponse.items || jsonResponse.items.length === 0) {
                console.log('No playlists found');
                return [];
            }

            return jsonResponse.items.map((playlist: any): SpotifyPlaylist => ({
                id: playlist.id,
                name: playlist.name,
                images: playlist.images || [],
                tracksTotal: playlist.tracks?.total || 0,
                tracks: [],
            }));
        } catch (error) {
            console.error('Error fetching playlists:', error);
            return [];
        }
    },

    async getPlaylistTracks(playlistId: string): Promise<any[]> {
        if (!SpotifyAuthStore.hasValidToken) {
            return [];
        }

        try {
            const response = await fetch(
                `https://api.spotify.com/v1/playlists/${playlistId}`,
                {
                    headers: { Authorization: `Bearer ${SpotifyAuthStore.accessToken}` }
                }
            );

            if (!response.ok) {
                console.error(`Failed to fetch playlist tracks: ${response.status}`);
                return [];
            }

            const jsonResponse = await response.json();
            return jsonResponse.tracks.items || [];
        } catch (error) {
            console.error('Error fetching playlist tracks:', error);
            return [];
        }
    },

    async getAlbums(): Promise<any> {
        if (!SpotifyAuthStore.hasValidToken) {
            return [];
        }
        
        try {
            let response;
            
            if (SpotifyAuthStore.isGuest) {
                response = await fetch(
                    `https://api.spotify.com/v1/browse/new-releases?limit=50`,
                    {
                        headers: { Authorization: `Bearer ${SpotifyAuthStore.accessToken}` }
                    }
                );
                
                if (!response.ok) {
                    console.error(`Failed to fetch new releases: ${response.status}`);
                    return [];
                }
                
                const jsonResponse = await response.json();
                // Return albums directly, not wrapped in {album: ...}
                return jsonResponse.albums.items || [];
            } else {
                response = await fetch(
                    `https://api.spotify.com/v1/me/albums?limit=50`,
                    {
                        headers: { Authorization: `Bearer ${SpotifyAuthStore.accessToken}` }
                    }
                );

                if (!response.ok) {
                    console.error(`Failed to fetch albums: ${response.status}`);
                    return [];
                }

                const jsonResponse = await response.json();
                // Extract just the album objects from saved albums
                return jsonResponse.items.map((item: any) => item.album) || [];
            }
        } catch (error) {
            console.error('Error fetching albums:', error);
            return [];
        }
    },

    // Logout
    logout(): void {
        SpotifyAuthStore.clearToken();
        // Clean up any legacy storage (for users who had old version)
        localStorage.removeItem('verifier');
        sessionStorage.removeItem('verifier');
        console.log('Logged out');
    },
};

export default Spotify;