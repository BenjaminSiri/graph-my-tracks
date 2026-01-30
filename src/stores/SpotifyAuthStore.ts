// stores/SpotifyAuthStore.ts
import { makeAutoObservable } from 'mobx';
import { SpotifyUserInfo, SpotifyPlaylist } from '../types/spotify';

class SpotifyAuthStore {
  accessToken: string = '';
  tokenExpirationTime: number = 0;
  userInfo: SpotifyUserInfo | null = null;
  playlists: SpotifyPlaylist[] = [];
  albums: any[] = [];
  isLoading: boolean = false;
  selectedPlaylistId: string | null = null;
  error: string | null = null;
  isGuest: boolean = false;

  constructor() {
    makeAutoObservable(this);
    this.loadTokenFromStorage();
    this.loadGuestModeFromStorage(); // Add this
  }

  // Save token and expiration
  setToken(token: string, expiresIn: number): void {
    this.accessToken = token;
    this.tokenExpirationTime = Date.now() + (expiresIn * 1000);
    
    // Persist to localStorage
    localStorage.setItem('spotify_access_token', token);
    localStorage.setItem('spotify_token_expiration', this.tokenExpirationTime.toString());
    
    this.error = null;
  }

  setGuestMode(isGuest: boolean) {
    this.isGuest = isGuest;
    localStorage.setItem('isGuest', JSON.stringify(isGuest));
    
    if (isGuest && !this.userInfo) {
      this.setUserInfo({
        display_name: 'Guest User',
        id: 'guest',
        email: '',
        country: '',
        images: [],
        followers: { total: 0 },
        external_urls: { spotify: '' }
      });
    }
  }

  // Load guest mode from localStorage
  loadGuestModeFromStorage(): void {
    const savedGuestMode = localStorage.getItem('isGuest');
    
    if (savedGuestMode) {
      this.isGuest = JSON.parse(savedGuestMode);
      
      // Set guest user info immediately if in guest mode
      if (this.isGuest && !this.userInfo) {
        this.userInfo = {
          display_name: 'Guest User',
          id: 'guest',
          email: '',
          country: '',
          images: [],
          followers: { total: 0 },
          external_urls: { spotify: '' }
        };
      }
    }
  }

  // Load token from localStorage on app initialization
  loadTokenFromStorage(): void {
    const savedToken = localStorage.getItem('spotify_access_token');
    const savedExpiration = localStorage.getItem('spotify_token_expiration');
    
    if (savedToken && savedExpiration) {
      const expirationTime = parseInt(savedExpiration, 10);
      if (Date.now() < expirationTime) {
        this.accessToken = savedToken;
        this.tokenExpirationTime = expirationTime;
      } else {
        // Token expired, clean up
        this.clearToken();
      }
    }
  }

  // Check if we have a valid token (computed property)
  get hasValidToken(): boolean {
    return !!this.accessToken && Date.now() < this.tokenExpirationTime;
  }

  // Get time until token expires (in minutes)
  get timeUntilExpiration(): number {
    if (!this.hasValidToken) return 0;
    return Math.floor((this.tokenExpirationTime - Date.now()) / 1000 / 60);
  }

  // Set user info
  setUserInfo(userInfo: SpotifyUserInfo): void {
    this.userInfo = userInfo;
  }

  // Set playlists
  setPlaylists(playlists: SpotifyPlaylist[]): void {
    this.playlists = playlists;
  }

  // Set loading state
  setLoading(isLoading: boolean): void {
    this.isLoading = isLoading;
  }

  // Set selected playlist
  setSelectedPlaylist(playlistId: string | null): void {
    this.selectedPlaylistId = playlistId;
  }

  setAlbums(albums: any[]): void {
    this.albums = albums;
  }

  // Get selected playlist
  get selectedPlaylist(): SpotifyPlaylist | null {
    if (!this.selectedPlaylistId) return null;
    return this.playlists.find(p => p.id === this.selectedPlaylistId) || null;
  }

  // Set error
  setError(error: string | null): void {
    this.error = error;
  }

  // Clear token and logout
  clearToken(): void {
    this.accessToken = '';
    this.tokenExpirationTime = 0;
    this.userInfo = null;
    this.playlists = [];
    this.albums = [];
    this.error = null;
    this.isGuest = false;
    
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiration');
    localStorage.removeItem('verifier');
    localStorage.removeItem('isGuest'); // Add this
  }

  // Check if user is authenticated
  get isAuthenticated(): boolean {
    return this.hasValidToken && this.userInfo !== null;
  }
}

export default new SpotifyAuthStore();