import { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface QRCodeProps {
  url: string;
  size?: number;
  showUrl?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

export default function QRCode({ 
  url, 
  size = 200, 
  showUrl = false,
  backgroundColor = '#FFFFFF',
  foregroundColor = '#000000'
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current) return;
      
      if (!url) {
        setError('URL이 제공되지 않았습니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        
        await QRCodeLib.toCanvas(canvasRef.current, url, {
          width: size,
          margin: 2,
          color: {
            dark: foregroundColor,
            light: backgroundColor
          }
        });
        
        setIsLoading(false);
      } catch (err) {
        setError('QR 코드를 생성할 수 없습니다.');
        setIsLoading(false);
      }
    };

    generateQR();
  }, [url, size, backgroundColor, foregroundColor]);

  return (
    <Box sx={{ textAlign: 'center' }}>
      {/* QR 코드 캔버스 */}
      <Box sx={{ mb: showUrl ? 1 : 0 }}>
        {isLoading && (
          <Box 
            sx={{ 
              width: size, 
              height: size, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
              mx: 'auto'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              생성 중...
            </Typography>
          </Box>
        )}
        
        {error && (
          <Box 
            sx={{ 
              width: size, 
              height: size, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#ffebee',
              borderRadius: 1,
              mx: 'auto'
            }}
          >
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}
        
        <canvas
          ref={canvasRef}
          style={{
            display: isLoading || error ? 'none' : 'block',
            borderRadius: '4px',
            margin: '0 auto'
          }}
        />
      </Box>

      {/* URL 표시 (옵션) */}
      {showUrl && (
        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
          {url}
        </Typography>
      )}
    </Box>
  );
}