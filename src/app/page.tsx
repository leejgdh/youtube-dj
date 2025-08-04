'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Header from '../components/Header';
import VideoPlayer from '../components/VideoPlayer';
import Playlist from '../components/Playlist';
import LoginForm from '../components/LoginForm';
import QRCodeOverlay from '../components/QRCodeOverlay';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

export default function YouTubeDJ() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [songEnded, setSongEnded] = useState(false);
  const { isAuthenticated, handleLogout } = useAuth();
  
  const {
    playlist,
    currentSong,
    isPlaying,
    isConnected,
    startPlaylist,
    pausePlaylist,
    resumePlaylist,
    playSpecificSong
  } = useSocket();

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handlePausePlaylist = () => {
    pausePlaylist();
  };

  const handleResumePlaylist = () => {
    resumePlaylist();
  };

  const handleStartPlaylist = () => {
    startPlaylist();
  };

  const handlePlaySpecificSong = (index: number) => {
    playSpecificSong(index);
  };

  const handleSongEnd = () => {
    setSongEnded(prev => !prev); // 상태를 토글해서 매번 다른 값으로 만들어 useEffect 트리거
  };

  // 로그인되지 않은 경우 로그인 폼 표시
  if (!isAuthenticated) {
    return (
      <LoginForm 
        title="YouTube DJ"
        icon={<MusicNoteIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />}
      />
    );
  }

  return (
    <Box sx={{ maxWidth: '100vw', mx: 'auto', py: 2, px: 1 }}>
      {/* 헤더 - 전체화면 모드에서는 숨김 */}
      {!isFullscreen && (
        <Header isConnected={isConnected} onLogout={handleLogout} />
      )}

      {/* YouTube Player */}
      <VideoPlayer 
        currentSong={currentSong}
        isPlaying={isPlaying}
        isFullscreen={isFullscreen}
        playlist={playlist}
        onToggleFullscreen={toggleFullscreen}
        onPlaySpecificSong={handlePlaySpecificSong}
        onSongEnd={handleSongEnd}
      />

      {/* 재생목록 - 전체화면 모드에서는 숨김 */}
      {!isFullscreen && (
        <Playlist 
          playlist={playlist}
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPausePlaylist={handlePausePlaylist}
          onResumePlaylist={handleResumePlaylist}
          onStartPlaylist={handleStartPlaylist}
          onPlaySpecificSong={handlePlaySpecificSong}
        />
      )}

      {/* QR코드 오버레이 */}
      <QRCodeOverlay
        showOnSongEnd={songEnded}
        isFullscreen={isFullscreen}
      />

    </Box>
  );
}
