const { createServer } = require('http');
const { Server } = require('socket.io');

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 서버 상태 저장 (테스트 데이터 포함)
let serverState = {
  playlist: [
    {
      id: 'test-1',
      title: '테스트 곡 1',
      nickname: '테스터',
      videoId: 'dQw4w9WgXcQ',
      timestamp: new Date().toISOString(),
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'test-2',
      title: '테스트 곡 2',
      nickname: '테스터2',
      videoId: 'oHg5SJYRHA0',
      timestamp: new Date().toISOString(),
      youtubeUrl: 'https://www.youtube.com/watch?v=oHg5SJYRHA0'
    }
  ],
  currentSong: {
    id: 'test-current',
    title: '현재 재생 중인 테스트 곡',
    nickname: '현재테스터',
    videoId: 'kJQP7kiw5Fk',
    timestamp: new Date().toISOString(),
    youtubeUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
  },
  isPlaying: true,
  lastUpdated: Date.now()
};

console.log('테스트 데이터로 서버 시작:', {
  playlist: serverState.playlist.length,
  currentSong: serverState.currentSong.title,
  isPlaying: serverState.isPlaying
});

// 상태 저장 함수
const saveState = () => {
  serverState.lastUpdated = Date.now();
  console.log('서버 상태 저장됨:', {
    playlist: serverState.playlist.length,
    currentSong: serverState.currentSong?.title || null,
    isPlaying: serverState.isPlaying
  });
};

io.on('connection', (socket) => {
  console.log('\n=== 새 클라이언트 연결 ===');
  console.log('Client connected:', socket.id);
  console.log('현재 서버 상태:', {
    playlist: serverState.playlist.length,
    currentSong: serverState.currentSong?.title || 'null',
    isPlaying: serverState.isPlaying
  });

  // 클라이언트 연결 시 현재 상태 전송
  socket.emit('server-state', serverState);
  console.log('서버 상태 전송 완료');
  console.log('========================\n');

  // 새로운 신청곡 처리
  socket.on('request-song', (data) => {
    const songWithId = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString()
    };
    console.log('Song request received:', songWithId);
    
    // 서버 상태 업데이트
    if (!serverState.currentSong) {
      serverState.currentSong = songWithId;
      serverState.isPlaying = true;
    } else {
      serverState.playlist.push(songWithId);
    }
    
    saveState();
    
    // 모든 클라이언트에게 새로운 신청곡 알림
    io.emit('new-song-request', songWithId);
  });

  // 다음 곡 재생 요청
  socket.on('play-next-song', () => {
    if (serverState.playlist.length > 0) {
      serverState.currentSong = serverState.playlist.shift();
      serverState.isPlaying = true;
      saveState();
      
      // 모든 클라이언트에게 다음 곡 재생 알림
      io.emit('next-song-playing', {
        currentSong: serverState.currentSong,
        playlist: serverState.playlist
      });
      
      console.log('다음 곡 재생:', serverState.currentSong.title);
    } else {
      serverState.currentSong = null;
      serverState.isPlaying = false;
      saveState();
      
      // 재생목록 종료 알림
      io.emit('playlist-ended');
      console.log('재생목록 종료');
    }
  });

  // 재생 상태 변경
  socket.on('update-play-state', (isPlaying) => {
    serverState.isPlaying = isPlaying;
    saveState();
    socket.broadcast.emit('play-state-changed', isPlaying);
  });

  // 특정 곡으로 건너뛰기
  socket.on('skip-to-song', (songIndex) => {
    if (songIndex >= 0 && songIndex < serverState.playlist.length) {
      const selectedSong = serverState.playlist[songIndex];
      serverState.playlist = serverState.playlist.slice(songIndex + 1);
      serverState.currentSong = selectedSong;
      serverState.isPlaying = true;
      saveState();
      
      io.emit('song-skipped', {
        currentSong: serverState.currentSong,
        playlist: serverState.playlist
      });
      
      console.log('곡 건너뛰기:', selectedSong.title);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 환경변수에서 포트 설정 가져오기
const PORT = process.env.SOCKET_SERVER_PORT || process.env.PORT || 3001;
const HOST = process.env.SERVER_HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Socket.IO server running on ${HOST}:${PORT}`);
  console.log('재생목록 상태 관리 서버 시작됨');
  console.log('환경 설정:', {
    port: PORT,
    host: HOST,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
}); 