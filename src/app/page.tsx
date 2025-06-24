'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Header from '../components/Header';
import VideoPlayer from '../components/VideoPlayer';
import Playlist from '../components/Playlist';
import { useSocket } from '../hooks/useSocket';

export default function YouTubeDJ() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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

  return (
    <Box sx={{ maxWidth: '100vw', mx: 'auto', py: 2, px: 1 }}>
      {/* 헤더 - 전체화면 모드에서는 숨김 */}
      {!isFullscreen && (
        <Header isConnected={isConnected} />
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
