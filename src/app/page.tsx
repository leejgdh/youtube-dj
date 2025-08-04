'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Header from '../components/Header';
import VideoPlayer from '../components/VideoPlayer';
import Playlist from '../components/Playlist';
import LoginForm from '../components/LoginForm';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

export default function YouTubeDJ() {
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    </Box>
  );
}
