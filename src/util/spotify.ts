import { SpotifyPlaylist } from '../types/spotify';
import SpotifyAuthStore from '../stores/SpotifyAuthStore';

const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
const redirectUri = process.env.REACT_APP_REDIRECT_URI || 'http://127.0.0.1:3000/callback';

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

  // Use sessionStorage instead of localStorage
  sessionStorage.setItem('verifier', verifier);
  // Also save to localStorage as backup
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
  console.log('Saved verifier:', verifier.substring(0, 10) + '...');
  
  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
},

// Step 2: Exchange code for access token
async getAccessToken(code: string): Promise<string> {
  // Try sessionStorage first, then localStorage
  let verifier = sessionStorage.getItem('verifier') || localStorage.getItem('verifier');
  
  // Retry a few times if verifier isn't found
  let retries = 0;
  while (!verifier && retries < 5) {
      console.log(`Verifier not found, retry ${retries + 1}/5...`);
      await new Promise(resolve => setTimeout(resolve, 200));
      verifier = sessionStorage.getItem('verifier') || localStorage.getItem('verifier');
      retries++;
  }

  if (!verifier) {
      console.error('Verifier still not found after retries');
      console.log('localStorage keys:', Object.keys(localStorage));
      console.log('sessionStorage keys:', Object.keys(sessionStorage));
      throw new Error('Verifier not found in storage');
  }

  console.log('Found verifier:', verifier.substring(0, 10) + '...');

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
          // Clean up both storages
          localStorage.removeItem('verifier');
          sessionStorage.removeItem('verifier');
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
      return jsonResponse.items.map((playlist: any): SpotifyPlaylist => ({
        id: playlist.id,
        name: playlist.name,
        images: playlist.images || [],
        tracksTotal: playlist.tracks?.total || 0,
        tracks: [],
      }));
    },

    async getPlaylistTracks(playlistId: string): Promise<any[]> {
      if (!SpotifyAuthStore.hasValidToken) {
        return [];
      }
    
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          headers: { Authorization: `Bearer ${SpotifyAuthStore.accessToken}` }
        }
      );
    
      if (!response.ok) {
        console.error('Failed to fetch playlist tracks');
        return [];
      }
    
      const jsonResponse = await response.json();
      return jsonResponse.tracks.items || [];
    },

    // Logout
    logout() {
      SpotifyAuthStore.clearToken();
      localStorage.removeItem('verifier');
      sessionStorage.removeItem('verifier');
      console.log('Logged out');
    },
};

export default Spotify;