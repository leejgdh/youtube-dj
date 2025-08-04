import { io } from 'socket.io-client';

// 소켓 URL 자동 결정
const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:8801`;
  }
  
  // 서버 사이드 렌더링 시 기본값
  return 'http://localhost:3001';
};

export const socket = io(getSocketUrl(), {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

export default socket; 