import { io } from 'socket.io-client';

// 소켓 URL 자동 결정
const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname;
    
    // 개발 환경에서는 3001 포트, 프로덕션(Docker)에서는 8801 포트
    const port = hostname === 'localhost' ? '3001' : '8801';
    return `${protocol}//${hostname}:${port}`;
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