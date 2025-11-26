// spotify.ts
import secret from './secrets.json';
import spotifyAuthStore from '../stores/SpotifyAuthStore';
import { SpotifyTokenResponse, SpotifyUserInfo, SpotifyError } from '../types/spotify';

const clientId: string = secret.clientId;
const redirectUri: string = 'http://127.0.0.1:3000/callback';

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

  // Step 2: Exchange code for access token (now saves to MobX)
  async getAccessToken(code: string): Promise<string> {
    spotifyAuthStore.setLoading(true);
    spotifyAuthStore.setError(null);

    const verifier = localStorage.getItem('verifier');

    if (!verifier) {
      const errorMsg = 'Verifier not found in localStorage';
      spotifyAuthStore.setError(errorMsg);
      spotifyAuthStore.setLoading(false);
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
      has_verifier: !!verifier
    });

    try {
      const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });

      const data: SpotifyTokenResponse | SpotifyError = await result.json();
      
      console.log('Token exchange response status:', result.status);
      console.log('Token exchange response:', data);
      
      if ('access_token' in data) {
        // Save to MobX store
        spotifyAuthStore.setToken(data.access_token, data.expires_in);
        localStorage.removeItem('verifier');
        
        console.log('Successfully obtained access token and saved to MobX');
        spotifyAuthStore.setLoading(false);
        
        return data.access_token;
      } else {
        const errorMsg = data.error_description || data.error || 'Failed to get access token';
        console.error('Token exchange failed:', errorMsg, data);
        spotifyAuthStore.setError(errorMsg);
        spotifyAuthStore.setLoading(false);
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Token exchange error:', error);
      spotifyAuthStore.setError(errorMsg);
      spotifyAuthStore.setLoading(false);
      throw error;
    }
  },

  // Check if we have a valid token (now uses MobX)
  hasValidToken(): boolean {
    return spotifyAuthStore.hasValidToken;
  },

  // Get the current access token (now from MobX)
  getCurrentToken(): string {
    return spotifyAuthStore.hasValidToken ? spotifyAuthStore.accessToken : '';
  },

  // Step 3: Fetch user profile (now saves to MobX)
  async getUserInfo(): Promise<SpotifyUserInfo | null> {
    if (!spotifyAuthStore.hasValidToken) {
      return null;
    }

    spotifyAuthStore.setLoading(true);

    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${spotifyAuthStore.accessToken}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }

      const userInfo: SpotifyUserInfo = await response.json();
      spotifyAuthStore.setUserInfo(userInfo);
      spotifyAuthStore.setLoading(false);
      
      return userInfo;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch user info';
      spotifyAuthStore.setError(errorMsg);
      spotifyAuthStore.setLoading(false);
      throw error;
    }
  },

  // Logout helper
  logout(): void {
    spotifyAuthStore.clearToken();
  }
};

export default Spotify;