import { useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { socket } from '../lib/socket';
import FullscreenPlaylist from './FullscreenPlaylist';
import { SongRequest } from '../types';

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  loadVideoById: (videoId: string) => void;
}

interface YouTubeEvent {
  target: YouTubePlayer;
  data: number;
}

interface VideoPlayerProps {
  currentSong: SongRequest | null;
  isPlaying: boolean;
  isFullscreen: boolean;
  playlist: SongRequest[];
  onToggleFullscreen: () => void;
  onPlaySpecificSong: (index: number) => void;
}

export default function VideoPlayer({ 
  currentSong, 
  isPlaying, 
  isFullscreen, 
  playlist,
  onToggleFullscreen,
  onPlaySpecificSong
}: VideoPlayerProps) {
  const playerRef = useRef<YouTubePlayer | null>(null);

  // currentSong이 변경될 때 YouTube Player 업데이트
  useEffect(() => {
    // 모든 조건을 엄격하게 체크
    if (!currentSong || !currentSong.videoId || !playerRef.current) {
      console.log('YouTube Player 업데이트 건너뛰기:', {
        currentSong: !!currentSong,
        videoId: currentSong?.videoId || 'null',
        player: !!playerRef.current
      });
      return;
    }

    try {
      console.log('새 곡 로드:', currentSong.title);
      playerRef.current.loadVideoById(currentSong.videoId);
    } catch (error) {
      console.error('YouTube Player 로드 오류:', error);
    }
  }, [currentSong]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const onPlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    console.log('YouTube Player 준비됨');
    if (isPlaying) {
      event.target.playVideo();
    }
  };

  const onPlayerStateChange = (event: YouTubeEvent) => {
    if (event.data === 0) { // 영상 종료
      console.log('영상 종료됨, 다음 곡 재생 요청');
      socket.emit('play-next-song');
    } else if (event.data === 1) { // 재생 중
      console.log('영상 재생 중');
      socket.emit('update-play-state', true);
    } else if (event.data === 2) { // 일시정지
      console.log('영상 일시정지');
      socket.emit('update-play-state', false);
    }
  };

  if (!currentSong || !currentSong.videoId) {
    return (
      <Card sx={{ mb: 3, p: 4, bgcolor: '#f5f5f5', textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          🎵 재생할 곡이 없습니다
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          신청곡을 등록하거나 재생목록에 곡을 추가해주세요
        </Typography>
      </Card>
    );
  }

  return (
    <>
      {/* 전체화면 오버레이 */}
      {isFullscreen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      )}
      <Card sx={{ mb: 3, bgcolor: '#000', borderRadius: 0 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
              🎤 현재 재생 중: {currentSong.title || '제목 없음'}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              onClick={onToggleFullscreen}
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                '&:hover': { 
                  borderColor: 'white', 
                  backgroundColor: 'rgba(255,255,255,0.1)' 
                }
              }}
            >
              {isFullscreen ? '전체화면 해제' : '전체화면'}
            </Button>
          </Box>
          <Box 
            id="youtube-player-container"
            sx={{ 
              position: 'relative', 
              width: '100%', 
              height: isFullscreen
                ? (playlist.length > 0 ? 'calc(100vh - 120px)' : '100vh')
                : '70vh',
              maxHeight: isFullscreen
                ? (playlist.length > 0 ? 'calc(100vh - 120px)' : '100vh')
                : '600px',
              backgroundColor: '#000',
              ...(isFullscreen && {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                zIndex: 9999,
              })
            }}
          >
            <YouTube
              videoId={currentSong.videoId}
              opts={{
                height: '100%',
                width: '100%',
                playerVars: {
                  autoplay: 1,
                  controls: 1,
                  modestbranding: 1,
                  rel: 0,
                  fs: 1,
                },
              }}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
              style={{ 
                width: '100%', 
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0
              }}
            />
          </Box>
          <Box sx={{ px: 2, pb: 2, pt: 1, bgcolor: '#000', color: 'white' }}>
            <Typography variant="body2" color="rgba(255,255,255,0.8)">신청자: {currentSong.nickname}</Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.8)">채널: {currentSong.author || '알 수 없음'}</Typography>
            {currentSong.duration && (
              <Typography variant="body2" color="rgba(255,255,255,0.8)">재생 시간: {formatDuration(currentSong.duration)}</Typography>
            )}
          </Box>
          
          {/* 전체화면 모드에서만 표시되는 다음 곡 목록 */}
          {isFullscreen && playlist.length > 0 && (
            <FullscreenPlaylist 
              playlist={playlist}
              onToggleFullscreen={onToggleFullscreen}
              onPlaySpecificSong={onPlaySpecificSong}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
