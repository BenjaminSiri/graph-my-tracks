// types/spotify.ts
export interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
  }
  
  export interface SpotifyUserInfo {
    display_name: string;
    email: string;
    id: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    country: string;
    followers: {
      total: number;
    };
    external_urls: {
      spotify: string;
    };
  }

  export interface SpotifyPlaylist {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    tracksTotal?: number;
    tracks?: any[];
  }

  export interface SpotifyAlbum {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    tracksTotal: number;
    tracks?: any[];
  }

  export interface SpotifyTrack {
    id: string;
    name: string;
    duration_ms: number;
  }

  export interface SpotifyError {
    error: string;
    error_description?: string;
  }