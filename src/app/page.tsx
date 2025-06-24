'use client';

import { useState, useEffect, useRef } from 'react';
import { socket } from '../lib/socket';
import YouTube from 'react-youtube';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import PauseIcon from '@mui/icons-material/Pause';
import AddIcon from '@mui/icons-material/Add';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

interface SongRequest {
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

// YouTube Player 타입 정의
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

export default function YouTubeDJ() {
  const [playlist, setPlaylist] = useState<SongRequest[]>([]);
  const [currentSong, setCurrentSong] = useState<SongRequest | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const listenersRegisteredRef = useRef(false);
  const processedSongsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 이미 리스너가 등록된 경우 중복 등록 방지
    if (listenersRegisteredRef.current) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }
    
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    
    // 서버 상태 수신
    const handleServerState = (state: any) => {
      console.log('\n=== 서버 상태 수신 ===');
      console.log('서버 상태:', {
        playlist: state.playlist?.length || 0,
        currentSong: state.currentSong?.title || 'null',
        isPlaying: state.isPlaying
      });
      
      setPlaylist(state.playlist || []);
      setCurrentSong(state.currentSong);
      setIsPlaying(state.isPlaying || false);
      
      console.log('클라이언트 상태 업데이트 완료');
      console.log('===================\n');
      
      // 서버로부터 받은 신청곡들을 처리된 것으로 표시
      if (state.currentSong) {
        processedSongsRef.current.add(state.currentSong.id);
      }
      state.playlist?.forEach((song: SongRequest) => {
        processedSongsRef.current.add(song.id);
      });
    };
    
    const handleNewSongRequest = (data: SongRequest) => {
      // id로만 중복 체크
      if (processedSongsRef.current.has(data.id)) {
        console.log('중복 신청곡 무시:', data.title);
        return;
      }
      processedSongsRef.current.add(data.id);
      const newSong = { ...data };
      console.log('새 신청곡 처리:', newSong.title);
      setCurrentSong(current => {
        if (!current) {
          setIsPlaying(true);
          return newSong;
        } else {
          setPlaylist(prev => prev.some(song => song.id === newSong.id) ? prev : [...prev, newSong]);
          return current;
        }
      });
    };

    // 다음 곡 재생 수신
    const handleNextSongPlaying = (data: any) => {
      console.log('다음 곡 재생 수신:', data.currentSong?.title);
      setCurrentSong(data.currentSong);
      setPlaylist(data.playlist || []);
      setIsPlaying(true);
    };

    // 재생목록 종료 수신
    const handlePlaylistEnded = () => {
      console.log('재생목록 종료 수신');
      setCurrentSong(null);
      setIsPlaying(false);
    };

    // 곡 건너뛰기 수신
    const handleSongSkipped = (data: any) => {
      console.log('곡 건너뛰기 수신:', data.currentSong?.title);
      setCurrentSong(data.currentSong);
      setPlaylist(data.playlist || []);
      setIsPlaying(true);
    };

    // 재생 상태 변경 수신
    const handlePlayStateChanged = (isPlaying: boolean) => {
      console.log('재생 상태 변경 수신:', isPlaying);
      setIsPlaying(isPlaying);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('server-state', handleServerState);
    socket.on('new-song-request', handleNewSongRequest);
    socket.on('next-song-playing', handleNextSongPlaying);
    socket.on('playlist-ended', handlePlaylistEnded);
    socket.on('song-skipped', handleSongSkipped);
    socket.on('play-state-changed', handlePlayStateChanged);
    
    listenersRegisteredRef.current = true;
    
    return () => { 
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('server-state', handleServerState);
      socket.off('new-song-request', handleNewSongRequest);
      socket.off('next-song-playing', handleNextSongPlaying);
      socket.off('playlist-ended', handlePlaylistEnded);
      socket.off('song-skipped', handleSongSkipped);
      socket.off('play-state-changed', handlePlayStateChanged);
      listenersRegisteredRef.current = false;
    };
  }, []);

  // currentSong이 변경될 때 YouTube Player 업데이트
  useEffect(() => {
    if (currentSong && currentSong.videoId && playerRef.current) {
      console.log('새 곡 로드:', currentSong.title);
      playerRef.current.loadVideoById(currentSong.videoId);
    }
  }, [currentSong]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // YouTube Player 이벤트 핸들러
  const onPlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    console.log('YouTube Player 준비됨');
    if (isPlaying) {
      event.target.playVideo();
    }
  };

  const onPlayerStateChange = (event: YouTubeEvent) => {
    // YouTube Player 상태 변경 감지
    if (event.data === 0) { // 영상 종료
      console.log('영상 종료됨, 다음 곡 재생 요청');
      // 서버에 다음 곡 재생 요청
      socket.emit('play-next-song');
    } else if (event.data === 1) { // 재생 중
      console.log('영상 재생 중');
      socket.emit('update-play-state', true);
    } else if (event.data === 2) { // 일시정지
      console.log('영상 일시정지');
      socket.emit('update-play-state', false);
    }
  };

  const startPlaylist = () => {
    if (playlist.length > 0 && !isPlaying) {
      socket.emit('play-next-song');
    }
  };

  const pausePlaylist = () => {
    setIsPlaying(false);
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
    socket.emit('update-play-state', false);
  };

  const resumePlaylist = () => {
    setIsPlaying(true);
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
    socket.emit('update-play-state', true);
  };

  const playSpecificSong = (songIndex: number) => {
    if (songIndex >= 0 && songIndex < playlist.length) {
      // 서버에 건너뛰기 요청
      socket.emit('skip-to-song', songIndex);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Box sx={{ maxWidth: '100vw', mx: 'auto', py: 2, px: 1 }}>
      {/* 헤더 - 전체화면 모드에서는 숨김 */}
      {!isFullscreen && (
        <>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} px={2}>
            <Typography variant="h4" fontWeight={700}>
              <MusicNoteIcon fontSize="large" sx={{ verticalAlign: 'middle', mr: 1 }} />
              YouTube DJ
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => window.open('/request', '_blank')}
              size="large"
            >
              신청곡 등록
            </Button>
          </Box>

          {/* 연결 상태 */}
          <Box textAlign="center" mb={2}>
            <Typography variant="body1" color={isConnected ? 'success.main' : 'error.main'}>
              {isConnected ? '🟢 서버 연결됨' : '🔴 서버 연결 안됨'}
            </Typography>
          </Box>
        </>
      )}

      {/* YouTube Player - 전체화면 */}
      {currentSong && currentSong.videoId ? (
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
                  onClick={toggleFullscreen}
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
                <Box 
                  sx={{ 
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(10px)',
                    p: 2,
                    zIndex: 10000,
                    maxHeight: '120px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'flex-end',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" color="white" mb={1} fontWeight={600}>
                      🎵 다음 곡들 ({playlist.length}곡)
                    </Typography>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        pb: 1,
                        '&::-webkit-scrollbar': {
                          height: '4px'
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '2px'
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: 'rgba(255,255,255,0.3)',
                          borderRadius: '2px',
                          '&:hover': {
                            background: 'rgba(255,255,255,0.5)'
                          }
                        }
                      }}
                    >
                      {playlist.slice(0, 20).map((song, index) => (
                        <Box 
                          key={song.id}
                          onClick={() => playSpecificSong(index)}
                          sx={{ 
                            minWidth: '180px',
                            maxWidth: '180px',
                            flex: '0 0 auto',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            borderRadius: 1,
                            p: 1,
                            border: '1px solid rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.2)',
                              transform: 'translateY(-2px)',
                              border: '1px solid rgba(255,255,255,0.4)'
                            }
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            color="white" 
                            sx={{ 
                              fontWeight: 600,
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.75rem',
                              lineHeight: 1.2
                            }}
                          >
                            {index + 1}. {song.title || '제목 없음'}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="rgba(255,255,255,0.7)"
                            sx={{ 
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.7rem',
                              lineHeight: 1.2
                            }}
                          >
                            신청자: {song.nickname}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={toggleFullscreen}
                    sx={{
                      ml: 2,
                      height: '48px',
                      width: '48px',
                      minWidth: '48px',
                      alignSelf: 'flex-end',
                      color: 'white',
                      borderColor: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    <FullscreenExitIcon />
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card sx={{ mb: 3, p: 4, bgcolor: '#f5f5f5', textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            🎵 재생할 곡이 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            신청곡을 등록하거나 재생목록에 곡을 추가해주세요
          </Typography>
        </Card>
      )}

      {/* 재생목록 - 전체화면 모드에서는 숨김 */}
      {!isFullscreen && (
        <Card sx={{ p: 3, bgcolor: '#fffde7', mx: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h5" fontWeight={700} color="warning.main">
              <QueueMusicIcon sx={{ mr: 1 }} />재생목록 ({playlist.length}곡)
            </Typography>
            <Box display="flex" gap={1}>
              {isPlaying ? (
                <Button
                  variant="contained"
                  color="warning"
                  size="medium"
                  startIcon={<PauseIcon />}
                  onClick={pausePlaylist}
                >
                  일시정지
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  size="medium"
                  startIcon={<PlayArrowIcon />}
                  onClick={currentSong ? resumePlaylist : startPlaylist}
                  disabled={playlist.length === 0 && !currentSong}
                >
                  {currentSong ? '재개' : '재생 시작'}
                </Button>
              )}
            </Box>
          </Box>
          
          {playlist.length === 0 && !currentSong ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary" fontStyle="italic" mb={2}>
                아직 신청된 곡이 없습니다.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => window.open('/request', '_blank')}
              >
                첫 번째 신청곡 등록하기
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" mb={2} fontStyle="italic">
                💡 재생목록의 곡을 클릭하면 해당 곡으로 바로 건너뛸 수 있습니다
              </Typography>
              <List>
                {currentSong && (
                  <ListItem sx={{ mb: 2, borderRadius: 2, bgcolor: '#e8f5e8', border: '2px solid #4caf50' }}>
                    <ListItemAvatar>
                      <Avatar variant="rounded" src={currentSong.thumbnail} sx={{ width: 64, height: 48, mr: 2 }}>
                        <MusicNoteIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          🎵 현재 재생: {currentSong.title || '제목 없음'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">신청자: {currentSong.nickname}</Typography>
                      </>}
                      secondary={<>
                        {currentSong.duration && <Typography variant="caption">⏱ {formatDuration(currentSong.duration)}</Typography>}
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          {currentSong.timestamp ? new Date(currentSong.timestamp).toLocaleTimeString() : ''}
                        </Typography>
                      </>}
                    />
                  </ListItem>
                )}
                {playlist.map((song, index) => (
                  <ListItem 
                    key={song.id} 
                    alignItems="flex-start" 
                    sx={{ 
                      mb: 1, 
                      borderRadius: 2, 
                      bgcolor: '#f9fbe7',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: '#e8f5e8',
                        transform: 'translateX(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }
                    }}
                    onClick={() => playSpecificSong(index)}
                  >
                    <ListItemAvatar>
                      <Avatar variant="rounded" sx={{ width: 48, height: 36, mr: 2, bgcolor: 'primary.main' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<>
                        <Typography variant="subtitle1" fontWeight={700}>{song.title || '제목 없음'}</Typography>
                        <Typography variant="body2" color="text.secondary">신청자: {song.nickname}</Typography>
                      </>}
                      secondary={<>
                        {song.duration && <Typography variant="caption">⏱ {formatDuration(song.duration)}</Typography>}
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          {song.timestamp ? new Date(song.timestamp).toLocaleTimeString() : ''}
                        </Typography>
                      </>}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Card>
      )}
    </Box>
  );
}
