'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import QRCode from './QRCode';

interface QRCodeOverlayProps {
  showOnSongEnd: boolean;
  isFullscreen: boolean;
}

export default function QRCodeOverlay({ 
  showOnSongEnd, 
  isFullscreen 
}: QRCodeOverlayProps) {
  const [showQR, setShowQR] = useState(false);

  // 신청곡 URL 생성
  const getRequestUrl = () => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      let hostname = window.location.hostname;
      
      // 환경변수에서 IP 주소 가져오기
      const configuredIP = process.env.NEXT_PUBLIC_HOST_IP;
      
      if (configuredIP && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        hostname = configuredIP;
      }
      
      const port = window.location.port;
      const portString = port ? `:${port}` : '';
      return `${protocol}//${hostname}${portString}/request`;
    }
    return '';
  };

  // 곡 종료 시 QR코드 표시 (showOnSongEnd가 변경될 때마다)
  useEffect(() => {
    console.log('Song ended - showing QR code');
    setShowQR(true);
    
    // 환경변수에서 설정된 시간(초) 후 QR코드 숨김
    const displayTimeSeconds = parseInt(process.env.NEXT_PUBLIC_QR_DISPLAY_TIME || '10');
    const displayTime = displayTimeSeconds * 1000;
    
    const timer = setTimeout(() => {
      console.log('Song end QR code auto-hide after', displayTimeSeconds, 'seconds');
      setShowQR(false);
    }, displayTime);
    
    // cleanup 함수에서 타이머 정리
    return () => clearTimeout(timer);
  }, [showOnSongEnd]);


  if (!showQR) return null;

  const qrContent = (
    <Box
      sx={{
        position: 'fixed',
        bottom: showQR ? 20 : -300,
        right: 20,
        zIndex: isFullscreen ? 2147483647 : 99999, // 전체화면일 때 최대 z-index 사용
        transition: 'bottom 0.5s ease-in-out',
        bgcolor: 'rgba(0, 0, 0, 0.9)',
        borderRadius: 2,
        p: 3,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          color: 'white', 
          textAlign: 'center', 
          mb: 2,
          fontWeight: 'bold'
        }}
      >
        📱 신청곡 등록
      </Typography>
      <QRCode
        url={getRequestUrl()}
        size={150}
        showUrl={false}
        backgroundColor="#FFFFFF"
        foregroundColor="#000000"
      />
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          textAlign: 'center', 
          display: 'block',
          mt: 1
        }}
      >
        QR코드를 스캔하여 신청하세요
      </Typography>
    </Box>
  );

  // 전체화면 모드일 때는 document.body에 포털로 렌더링
  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(qrContent, document.body);
  }

  return qrContent;
}