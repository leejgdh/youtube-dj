import { io } from 'socket.io-client';

// 소켓 URL 자동 결정
const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname;
    const webPort = window.location.port;
    
    // 웹 포트에 따라 소켓 포트 결정
    let socketPort;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // 로컬 개발 환경
      socketPort = '3001';
    } else if (webPort === '8800') {
      // Docker 프로덕션 환경 (웹:8800 → 소켓:8801)
      socketPort = '8801';
    } else if (webPort === '3000') {
      // 개발 환경에서 IP로 접속 (웹:3000 → 소켓:3001)
      socketPort = '3001';
    } else {
      // 기본값
      socketPort = '3001';
    }
    
    return `${protocol}//${hostname}:${socketPort}`;
  }
  
  // 서버 사이드 렌더링 시 기본값
  return 'http://localhost:3001';
};

const socketUrl = getSocketUrl();
console.log('Socket connecting to:', socketUrl);

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

// 연결 상태 로깅
socket.on('connect', () => {
  console.log('Socket connected to:', socketUrl);
});

socket.on('disconnect', () => {
  console.log('Socket disconnected from:', socketUrl);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

export default socket; 