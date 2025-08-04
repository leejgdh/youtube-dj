import { io } from 'socket.io-client';

// 런타임에 소켓 URL 결정
const getSocketUrl = () => {
  // 환경변수가 설정되어 있으면 사용
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  
  // 브라우저 환경에서 현재 호스트의 IP를 사용
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname;
    const port = process.env.NEXT_PUBLIC_SOCKET_PORT || '8801';
    return `${protocol}//${hostname}:${port}`;
  }
  
  // 서버 사이드 렌더링 시 기본값
  return 'http://localhost:3001';
};

const socketUrl = getSocketUrl();

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

export default socket; 