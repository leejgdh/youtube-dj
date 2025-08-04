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
  lastUpdated: Date.now(),
  // 재생 히스토리 (과거에 재생된 모든 곡들)
  playHistory: [],
  // 히스토리 재생 인덱스 (순차 반복용)
  historyPlayIndex: 0,
  // 관리자 모드 설정
  adminMode: {
    approvalRequired: false, // false: 자유모드, true: 승인모드
  },
  // 승인 대기 중인 신청곡들
  pendingRequests: []
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
    
    // 승인모드인지 확인
    if (serverState.adminMode.approvalRequired) {
      // 승인모드: 대기 목록에 추가
      serverState.pendingRequests.push(songWithId);
      saveState();
      
      // 관리자에게 새로운 승인 요청 알림
      io.emit('pending-requests-updated', serverState.pendingRequests);
      
      console.log('승인모드 - 요청이 대기 목록에 추가됨:', songWithId.title);
    } else {
      // 자유모드: 바로 재생목록에 추가
      if (!serverState.currentSong) {
        serverState.currentSong = songWithId;
        serverState.isPlaying = true;
      } else {
        serverState.playlist.push(songWithId);
      }
      
      saveState();
      
      // 모든 클라이언트에게 새로운 신청곡 알림
      io.emit('new-song-request', songWithId);
      
      console.log('자유모드 - 요청이 바로 재생목록에 추가됨:', songWithId.title);
    }
  });

  // 다음 곡 재생 요청
  socket.on('play-next-song', () => {
    // 현재 곡을 히스토리에 추가 (동일한 videoId 중복 방지)
    if (serverState.currentSong && !serverState.playHistory.find(song => song.videoId === serverState.currentSong.videoId)) {
      serverState.playHistory.push({...serverState.currentSong});
    }
    
    if (serverState.playlist.length > 0) {
      // 재생목록에서 다음 곡 가져오기
      serverState.currentSong = serverState.playlist.shift();
      serverState.isPlaying = true;
      saveState();
      
      // 모든 클라이언트에게 다음 곡 재생 알림
      io.emit('next-song-playing', {
        currentSong: serverState.currentSong,
        playlist: serverState.playlist
      });
      
      console.log('다음 곡 재생:', serverState.currentSong.title);
    } else if (serverState.playHistory.length > 0) {
      // 재생목록이 비어있으면 히스토리에서 순차 재생
      serverState.currentSong = serverState.playHistory[serverState.historyPlayIndex];
      serverState.historyPlayIndex = (serverState.historyPlayIndex + 1) % serverState.playHistory.length;
      serverState.isPlaying = true;
      saveState();
      
      // 모든 클라이언트에게 히스토리 재생 알림
      io.emit('next-song-playing', {
        currentSong: serverState.currentSong,
        playlist: serverState.playlist,
        isHistoryPlaying: true
      });
      
      console.log('히스토리에서 재생:', serverState.currentSong.title, `(${serverState.historyPlayIndex}/${serverState.playHistory.length})`);
    } else {
      serverState.currentSong = null;
      serverState.isPlaying = false;
      saveState();
      
      // 재생목록 종료 알림
      io.emit('playlist-ended');
      console.log('재생목록 종료 - 히스토리도 비어있음');
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

  // 관리자 모드 상태 요청
  socket.on('get-admin-mode', () => {
    socket.emit('admin-mode-updated', serverState.adminMode.approvalRequired);
  });

  // 클라이언트에서 저장된 모드로 서버 상태 초기화 (첫 연결 시)
  socket.on('init-admin-mode', (storedMode) => {
    if (typeof storedMode === 'boolean') {
      serverState.adminMode.approvalRequired = storedMode;
      saveState();
      
      // 모든 클라이언트에게 모드 변경 알림
      io.emit('admin-mode-updated', storedMode);
      
      console.log(`localStorage에서 관리자 모드 복원: ${storedMode ? '승인모드' : '자유모드'}`);
    }
  });

  // 관리자 모드 설정
  socket.on('set-admin-mode', (approvalRequired) => {
    serverState.adminMode.approvalRequired = approvalRequired;
    saveState();
    
    // 모든 클라이언트에게 모드 변경 알림
    io.emit('admin-mode-updated', approvalRequired);
    
    console.log(`관리자 모드 변경됨: ${approvalRequired ? '승인모드' : '자유모드'}`);
    
    // 자유모드로 변경시 대기 중인 모든 요청을 자동 승인
    if (!approvalRequired && serverState.pendingRequests.length > 0) {
      const approvedRequests = [...serverState.pendingRequests];
      serverState.pendingRequests = [];
      
      approvedRequests.forEach(request => {
        if (!serverState.currentSong) {
          serverState.currentSong = request;
          serverState.isPlaying = true;
        } else {
          serverState.playlist.push(request);
        }
      });
      
      saveState();
      
      // 모든 클라이언트에게 자동 승인된 요청들 알림
      approvedRequests.forEach(request => {
        io.emit('new-song-request', request);
      });
      
      // 대기 목록 업데이트
      io.emit('pending-requests-updated', serverState.pendingRequests);
      
      console.log(`자유모드 전환으로 ${approvedRequests.length}개 요청 자동 승인됨`);
    }
  });

  // 대기 중인 요청 목록 요청
  socket.on('get-pending-requests', () => {
    socket.emit('pending-requests-updated', serverState.pendingRequests);
  });

  // 요청 승인
  socket.on('approve-request', (requestId) => {
    const requestIndex = serverState.pendingRequests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
      const approvedRequest = serverState.pendingRequests.splice(requestIndex, 1)[0];
      
      // 승인된 요청을 재생목록에 추가
      if (!serverState.currentSong) {
        serverState.currentSong = approvedRequest;
        serverState.isPlaying = true;
      } else {
        serverState.playlist.push(approvedRequest);
      }
      
      saveState();
      
      // 모든 클라이언트에게 승인된 요청 알림
      io.emit('new-song-request', approvedRequest);
      
      // 대기 목록 업데이트
      io.emit('pending-requests-updated', serverState.pendingRequests);
      
      console.log('요청 승인됨:', approvedRequest.title);
    }
  });

  // 요청 거부
  socket.on('reject-request', (requestId) => {
    const requestIndex = serverState.pendingRequests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
      const rejectedRequest = serverState.pendingRequests.splice(requestIndex, 1)[0];
      saveState();
      
      // 대기 목록 업데이트
      io.emit('pending-requests-updated', serverState.pendingRequests);
      
      console.log('요청 거부됨:', rejectedRequest.title);
    }
  });

  // 모든 대기 요청 삭제
  socket.on('clear-pending-requests', () => {
    const clearedCount = serverState.pendingRequests.length;
    serverState.pendingRequests = [];
    saveState();
    
    // 대기 목록 업데이트
    io.emit('pending-requests-updated', serverState.pendingRequests);
    
    console.log(`${clearedCount}개의 대기 요청이 모두 삭제됨`);
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