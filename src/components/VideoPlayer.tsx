import { useRef, useEffect, useState, memo } from 'react';
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
import QRCode from './QRCode';
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

function VideoPlayer({ 
  currentSong, 
  isPlaying, 
  isFullscreen, 
  playlist,
  onToggleFullscreen,
  onPlaySpecificSong
}: VideoPlayerProps) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  // 신청곡 URL 생성
  const getRequestUrl = () => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      let hostname = window.location.hostname;
      
      // 환경변수에서 IP 주소 가져오기
      const configuredIP = process.env.NEXT_PUBLIC_HOST_IP;
      
      if (configuredIP && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        hostname = configuredIP;
      }
      
      const port = window.location.port;
      const portString = port ? `:${port}` : '';
      return `${protocol}//${hostname}${portString}/request`;
    }
    return '';
  };

  // currentSong이 변경될 때 YouTube Player 업데이트
  useEffect(() => {
    // 모든 조건을 엄격하게 체크 (플레이어 준비 상태 포함)
    if (!currentSong || !currentSong.videoId || !playerRef.current || !playerReady) {
      return;
    }

    try {
      playerRef.current.loadVideoById(currentSong.videoId);
    } catch (error) {
      console.error('YouTube Player 로드 에러:', error);
    }
  }, [currentSong, playerReady]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const onPlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    setPlayerReady(true);
    if (isPlaying) {
      event.target.playVideo();
    }
  };

  const onPlayerStateChange = (event: YouTubeEvent) => {
    if (event.data === 0) { // 영상 종료
      
      // 전체화면 모드에서만 QR코드 표시
      if (isFullscreen) {
        setShowQR(true);
        // 환경변수에서 설정된 시간(초) 후 QR코드 숨김
        const displayTimeSeconds = parseInt(process.env.NEXT_PUBLIC_QR_DISPLAY_TIME || '5');
        const displayTime = displayTimeSeconds * 1000;
        setTimeout(() => {
          setShowQR(false);
        }, displayTime);
      }
      
      // 항상 다음 곡으로 이동 (서버에서 히스토리 기반 재생 처리)
      socket.emit('play-next-song');
    } else if (event.data === 1) { // 재생 중
      socket.emit('update-play-state', true);
    } else if (event.data === 2) { // 일시정지
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
              key={currentSong.videoId} // 동일한 videoId면 리마운트 방지
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

          {/* 전체화면 모드에서 곡 종료 시 QR코드 표시 */}
          {isFullscreen && (
            <Box
              sx={{
                position: 'fixed',
                bottom: showQR ? 20 : -300,
                right: 20,
                zIndex: 10000,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: 2,
                p: 3,
                transition: 'bottom 0.5s ease-in-out',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  신청곡을 등록해주세요!
                </Typography>
                <QRCode
                  url={getRequestUrl()}
                  size={150}
                  backgroundColor="#FFFFFF"
                  foregroundColor="#000000"
                />
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// React.memo를 사용하여 필요한 경우에만 리렌더링
export default memo(VideoPlayer, (prevProps, nextProps) => {
  // 기본 상태 비교
  const currentSongSame = (
    prevProps.currentSong?.id === nextProps.currentSong?.id &&
    prevProps.currentSong?.videoId === nextProps.currentSong?.videoId
  );
  const isPlayingSame = prevProps.isPlaying === nextProps.isPlaying;
  const isFullscreenSame = prevProps.isFullscreen === nextProps.isFullscreen;
  
  // 풀스크린 모드에서는 playlist 변경도 감지해야 함
  let playlistSame = true;
  if (prevProps.isFullscreen || nextProps.isFullscreen) {
    playlistSame = (
      prevProps.playlist?.length === nextProps.playlist?.length &&
      prevProps.playlist?.every((song, index) => song.id === nextProps.playlist?.[index]?.id)
    );
  }
  
  return currentSongSame && isPlayingSame && isFullscreenSame && playlistSame;
});
