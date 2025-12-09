import SpotifyAuthStore from '../stores/SpotifyAuthStore';
import secrets from '../util/secrets.json';

const clientId = secrets.clientId;
const redirectUri = 'http://127.0.0.1:3000/callback'; // Change for production

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
    async redirectToAuthCodeFlow() {
        const verifier = generateRandomString(64);
        const hashed = await sha256(verifier);
        const challenge = base64encode(hashed);

        localStorage.setItem('verifier', verifier);

        const params = new URLSearchParams({
            client_id: clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            scope: 'user-top-read',
            code_challenge_method: 'S256',
            code_challenge: challenge,
        });

        console.log('Redirecting to Spotify with redirect_uri:', redirectUri);
        window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    },

    // Step 2: Exchange code for access token
    async getAccessToken(code: string): Promise<string> {
        const verifier = localStorage.getItem('verifier');

        if (!verifier) {
            throw new Error('Verifier not found in localStorage');
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
            has_verifier: !!verifier
        });

        try {
            const result = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            const data = await result.json();
            
            console.log('Token exchange response status:', result.status);
            console.log('Token exchange response:', data);
            
            if (data.access_token) {
                // Store in MobX store
                SpotifyAuthStore.setToken(data.access_token, data.expires_in);
                localStorage.removeItem('verifier');
                console.log('Successfully obtained access token');
                return data.access_token;
            } else {
                const errorMsg = data.error_description || data.error || 'Failed to get access token';
                console.error('Token exchange failed:', errorMsg, data);
                SpotifyAuthStore.setError(errorMsg);
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Token exchange error:', error);
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
                throw new Error('Failed to fetch user info');
            }

            const data = await response.json();
            SpotifyAuthStore.setUserInfo(data);
            return data;
        } catch (error) {
            console.error('Error fetching user info:', error);
            SpotifyAuthStore.setError('Failed to fetch user info');
            throw error;
        } finally {
            SpotifyAuthStore.setLoading(false);
        }
    },

    // Fetch top tracks or artists
    async getTop(type: 'tracks' | 'artists', range: string) {
        if (!SpotifyAuthStore.hasValidToken) {
            return [];
        }

        const response = await fetch(
            `https://api.spotify.com/v1/me/top/${type}?time_range=${range}&limit=10`,
            {
                headers: { Authorization: `Bearer ${SpotifyAuthStore.accessToken}` }
            }
        );

        if (!response.ok) {
            console.error('Failed to fetch top items');
            return [];
        }

        const jsonResponse = await response.json();

        if (!jsonResponse.items || jsonResponse.items.length === 0) {
            console.log('No items found');
            return [];
        }

        if (type === 'tracks') {
            return jsonResponse.items.map((track: any) => ({
                target: track.name,
                trackVisible: false,
                hint: track.artists[0].name,
                hintVisible: false
            }));
        } else {
            return jsonResponse.items.map((artist: any) => ({
                target: artist.name,
                trackVisible: false,
                hint: '',
                hintVisible: false
            }));
        }
    },

    // fetch user's playlists
    async getUserPlaylists() {
      if (!SpotifyAuthStore.hasValidToken) {
        return [];
      }

      if (!SpotifyAuthStore.userInfo) {
        console.error('User info not available');
        return [];
      }

      const response = await fetch(
        `https://api.spotify.com/v1/users/${SpotifyAuthStore.userInfo.id}/playlists?limit=10`,
        {
            headers: { Authorization: `Bearer ${SpotifyAuthStore.accessToken}` }
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch user's playlists`);
        return [];
      }

      const jsonResponse = await response.json();

      if (!jsonResponse.items || jsonResponse.items.length === 0) {
        console.log('No playlists found');
        return [];
      }

      console.log('Fetched playlists:', jsonResponse.items);

      return jsonResponse.items.map((playlist: any) => ({
          name: playlist.name,
          id: playlist.id,
          tracksTotal: playlist.tracks.total,
      }));
    },

    // Logout
    logout() {
        SpotifyAuthStore.clearToken();
        console.log('Logged out');
    },
};

export default Spotify;