export interface SongRequest {
  id: string;
  youtubeUrl: string;
  nickname: string;
  title?: string;
  duration?: number;
  thumbnail?: string;
  author?: string;
  timestamp: Date;
  videoId?: string;
}

export interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  loadVideoById: (videoId: string) => void;
}

export interface YouTubeEvent {
  target: YouTubePlayer;
  data: number;
}

// 서버 상태 관련 타입 정의
export interface ServerState {
  playlist: SongRequest[];
  currentSong: SongRequest | null;
  isPlaying: boolean;
  lastUpdated?: number;
}

export interface NextSongData {
  currentSong: SongRequest | null;
  playlist: SongRequest[];
}

export interface SongSkippedData {
  currentSong: SongRequest | null;
  playlist: SongRequest[];
}
