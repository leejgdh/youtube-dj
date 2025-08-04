import { useState, useEffect, useRef } from 'react';
import { socket } from '../lib/socket';
import { SongRequest, ServerState, NextSongData, SongSkippedData } from '../types';

export function useSocket() {
  const [playlist, setPlaylist] = useState<SongRequest[]>([]);
  const [currentSong, setCurrentSong] = useState<SongRequest | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [approvalMode, setApprovalMode] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
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
    
    const handleConnect = () => {
      setIsConnected(true);
      
      // localStorage에서 저장된 모드 확인
      if (typeof window !== 'undefined') {
        const storedMode = localStorage.getItem('youtube-dj-admin-mode');
        if (storedMode !== null) {
          const mode = storedMode === 'true';
          setApprovalMode(mode);
          // 서버에 저장된 모드로 초기화 요청
          socket.emit('init-admin-mode', mode);
        } else {
          // 저장된 모드가 없으면 서버 상태 요청
          socket.emit('get-admin-mode');
        }
      } else {
        // 서버 사이드에서는 기본 요청
        socket.emit('get-admin-mode');
      }
    };
    const handleDisconnect = () => setIsConnected(false);
    
    // 서버 상태 수신
    const handleServerState = (state: ServerState) => {
      console.log('\n=== 서버 상태 수신 ===');
      console.log('서버 상태:', {
        playlist: state.playlist?.length || 0,
        currentSong: state.currentSong?.title || 'null',
        isPlaying: state.isPlaying
      });
      
      // 안전하게 상태 업데이트
      if (Array.isArray(state.playlist)) {
        setPlaylist(state.playlist);
      } else {
        setPlaylist([]);
      }
      
      // currentSong을 안전하게 설정
      if (state.currentSong && typeof state.currentSong === 'object') {
        setCurrentSong(state.currentSong);
      } else {
        setCurrentSong(null);
      }
      
      setIsPlaying(Boolean(state.isPlaying));
      
      console.log('클라이언트 상태 업데이트 완료');
      console.log('===================\n');
      
      // 서버로부터 받은 신청곡들을 처리된 것으로 표시
      if (state.currentSong && state.currentSong.id) {
        processedSongsRef.current.add(state.currentSong.id);
      }
      if (Array.isArray(state.playlist)) {
        state.playlist.forEach((song: SongRequest) => {
          if (song && song.id) {
            processedSongsRef.current.add(song.id);
          }
        });
      }
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
    const handleNextSongPlaying = (data: NextSongData) => {
      console.log('다음 곡 재생 수신:', data.currentSong?.title);
      
      if (data.currentSong && typeof data.currentSong === 'object') {
        setCurrentSong(data.currentSong);
      } else {
        setCurrentSong(null);
      }
      
      if (Array.isArray(data.playlist)) {
        setPlaylist(data.playlist);
      } else {
        setPlaylist([]);
      }
      
      setIsPlaying(true);
    };

    // 재생목록 종료 수신
    const handlePlaylistEnded = () => {
      console.log('재생목록 종료 수신');
      setCurrentSong(null);
      setIsPlaying(false);
    };

    // 곡 건너뛰기 수신
    const handleSongSkipped = (data: SongSkippedData) => {
      console.log('곡 건너뛰기 수신:', data.currentSong?.title);
      
      if (data.currentSong && typeof data.currentSong === 'object') {
        setCurrentSong(data.currentSong);
      } else {
        setCurrentSong(null);
      }
      
      if (Array.isArray(data.playlist)) {
        setPlaylist(data.playlist);
      } else {
        setPlaylist([]);
      }
      
      setIsPlaying(true);
    };

    // 재생 상태 변경 수신
    const handlePlayStateChanged = (isPlaying: boolean) => {
      console.log('재생 상태 변경 수신:', isPlaying);
      setIsPlaying(isPlaying);
    };

    // 관리자 모드 상태 변경 수신
    const handleAdminModeUpdated = (mode: boolean) => {
      console.log('관리자 모드 변경 수신:', mode);
      setApprovalMode(mode);
      // localStorage에 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('youtube-dj-admin-mode', mode.toString());
      }
    };

    // 승인 대기 목록 업데이트 수신
    const handlePendingRequestsUpdated = (requests: any[]) => {
      console.log('승인 대기 목록 업데이트 수신:', requests.length);
      setPendingRequests(requests);
    };

    // 재생목록 업데이트 수신 (관리자 조작용)
    const handlePlaylistUpdated = (data: { playlist: SongRequest[], currentSong: SongRequest | null }) => {
      console.log('재생목록 업데이트 수신:', data.playlist.length);
      setPlaylist(data.playlist || []);
      setCurrentSong(data.currentSong);
      if (data.currentSong) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('server-state', handleServerState);
    socket.on('new-song-request', handleNewSongRequest);
    socket.on('next-song-playing', handleNextSongPlaying);
    socket.on('playlist-ended', handlePlaylistEnded);
    socket.on('song-skipped', handleSongSkipped);
    socket.on('play-state-changed', handlePlayStateChanged);
    socket.on('admin-mode-updated', handleAdminModeUpdated);
    socket.on('pending-requests-updated', handlePendingRequestsUpdated);
    socket.on('playlist-updated', handlePlaylistUpdated);
    
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
      socket.off('admin-mode-updated', handleAdminModeUpdated);
      socket.off('pending-requests-updated', handlePendingRequestsUpdated);
      socket.off('playlist-updated', handlePlaylistUpdated);
      listenersRegisteredRef.current = false;
    };
  }, []);

  // Socket 액션들
  const socketActions = {
    startPlaylist: () => {
      if (playlist.length > 0 && !isPlaying) {
        socket.emit('play-next-song');
      }
    },

    pausePlaylist: () => {
      socket.emit('update-play-state', false);
    },

    resumePlaylist: () => {
      socket.emit('update-play-state', true);
    },

    playSpecificSong: (songIndex: number) => {
      if (songIndex >= 0 && songIndex < playlist.length) {
        socket.emit('skip-to-song', songIndex);
      }
    }
  };

  return {
    // State
    playlist,
    currentSong,
    isPlaying,
    isConnected,
    approvalMode,
    pendingRequests,
    // Actions
    ...socketActions
  };
}
