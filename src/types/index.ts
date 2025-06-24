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
