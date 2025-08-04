'use client';

import { useState, useEffect } from 'react';
import { socket } from '../../lib/socket';
import { useRouter } from 'next/navigation';
import { useSocket } from '../../hooks/useSocket';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import PersonIcon from '@mui/icons-material/Person';
import LinkIcon from '@mui/icons-material/Link';
import HomeIcon from '@mui/icons-material/Home';

interface SongRequest {
  id: string;
  youtubeUrl: string;
  nickname: string;
  title?: string;
  duration?: number;
  thumbnail?: string;
  author?: string;
  timestamp: Date;
  videoId?: string;
}

export default function RequestPage() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info' | 'warning'}>({
    open: false,
    message: '',
    severity: 'info'
  });
  const router = useRouter();
  
  // useSocket 훅에서 연결 상태와 승인 모드 가져오기
  const { isConnected, approvalMode } = useSocket();

  // Toast 표시 함수
  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({
      open: true,
      message,
      severity
    });
  };

  const handleToastClose = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    // 저장된 닉네임 불러오기
    const savedNickname = localStorage.getItem('youtube-dj-nickname');
    if (savedNickname) {
      setNickname(savedNickname);
    }
    
    // 금지곡 에러 처리
    const handleSongRequestError = (data: { error: string; song: SongRequest }) => {
      showToast(data.error, 'error');
      setIsLoading(false);
    };
    
    socket.on('song-request-error', handleSongRequestError);
    
    return () => {
      socket.off('song-request-error', handleSongRequestError);
    };
  }, []);

  // YouTube URL에서 videoId 추출
  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYouTubeInfo = async (url: string): Promise<Partial<SongRequest>> => {
    try {
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error('YouTube 정보를 가져오는데 실패했습니다.');
      }
      
      const data = await response.json();
      const videoId = extractVideoId(url);
      
      return {
        title: data.title || '제목을 가져올 수 없습니다',
        duration: data.duration ? parseInt(data.duration) : 0,
        thumbnail: data.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        author: data.author || '알 수 없음',
        videoId: videoId || undefined
      };
    } catch (error) {
      console.error('YouTube 정보 가져오기 실패:', error);
      const videoId = extractVideoId(url);
      return { 
        title: '제목을 가져올 수 없습니다',
        videoId: videoId || undefined,
        thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : undefined
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim() || !nickname.trim()) return;
    setIsLoading(true);
    try {
      const youtubeInfo = await getYouTubeInfo(youtubeUrl.trim());
      
      // 금지곡 체크
      const checkResponse = await fetch('/api/check-banned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl: youtubeUrl.trim(), videoId: youtubeInfo.videoId })
      });
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.isBanned) {
          showToast('이 곡은 금지곡으로 등록되어 있어 신청할 수 없습니다.', 'warning');
          setIsLoading(false);
          return;
        }
      }
      
      const songRequest: SongRequest = {
        id: Date.now().toString(),
        youtubeUrl: youtubeUrl.trim(),
        nickname: nickname.trim(),
        timestamp: new Date(),
        ...youtubeInfo
      };
      socket.emit('request-song', songRequest);
      
      // 닉네임을 localStorage에 저장
      localStorage.setItem('youtube-dj-nickname', nickname.trim());
      
      setYoutubeUrl('');
      // 닉네임은 유지 (초기화하지 않음)
      showToast('신청곡이 등록되었습니다!', 'success');
    } catch {
      showToast('신청곡 등록에 실패했습니다. URL을 확인해주세요.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNickname = e.target.value;
    setNickname(newNickname);
    // 닉네임이 변경될 때마다 localStorage에 저장
    if (newNickname.trim()) {
      localStorage.setItem('youtube-dj-nickname', newNickname.trim());
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', py: 4, px: 2 }}>
      {/* 헤더 */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Typography variant="h4" fontWeight={700}>
          <QueueMusicIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          신청곡 등록
        </Typography>
        <Button
          variant="outlined"
          startIcon={<HomeIcon />}
          onClick={() => router.push('/')}
        >
          메인으로
        </Button>
      </Box>

      {/* 연결 상태 및 모드 표시 */}
      <Box textAlign="center" mb={3}>
        <Typography variant="body1" color={isConnected ? 'success.main' : 'error.main'} mb={1}>
          {isConnected ? '🟢 서버 연결됨' : '🔴 서버 연결 안됨'}
        </Typography>
        {isConnected && (
          <Card sx={{ 
            p: 2, 
            bgcolor: approvalMode ? '#fff3e0' : '#e8f5e8',
            border: `2px solid ${approvalMode ? '#ff9800' : '#4caf50'}`
          }}>
            <Typography 
              variant="h6" 
              color={approvalMode ? 'warning.main' : 'success.main'}
              fontWeight="bold"
            >
              {approvalMode ? '⏳ 승인 모드' : '✅ 자유 모드'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {approvalMode 
                ? '신청곡은 관리자 승인 후 재생목록에 추가됩니다.'
                : '신청곡이 바로 재생목록에 추가됩니다.'
              }
            </Typography>
          </Card>
        )}
      </Box>


      {/* 신청곡 입력 폼 */}
      <Card sx={{ p: 3, bgcolor: '#e3f2fd' }}>
        <Typography variant="h6" mb={3} fontWeight={700}>
          <QueueMusicIcon sx={{ mr: 1 }} />신청곡 정보 입력
        </Typography>
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
          <TextField
            label="닉네임"
            value={nickname}
            onChange={handleNicknameChange}
            required
            disabled={isLoading || !isConnected}
            InputProps={{ startAdornment: <PersonIcon sx={{ mr: 1 }} /> }}
            placeholder="닉네임을 입력하세요"
            fullWidth
            helperText="닉네임은 자동으로 저장되어 다음 신청 시에도 유지됩니다"
          />
          <TextField
            label="YouTube URL"
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            required
            disabled={isLoading || !isConnected}
            InputProps={{ startAdornment: <LinkIcon sx={{ mr: 1 }} /> }}
            placeholder="YouTube 영상 URL을 복사해서 붙여넣으세요"
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={isLoading || !isConnected}
            startIcon={<QueueMusicIcon />}
            sx={{ py: 1.5 }}
          >
            {isLoading ? '처리 중...' : '신청하기'}
          </Button>
        </Box>
      </Card>

      {/* 사용법 안내 */}
      <Card sx={{ mt: 3, p: 3, bgcolor: '#fff3e0' }}>
        <Typography variant="h6" mb={2} fontWeight={700} color="warning.main">
          📋 사용법
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <Typography component="li" variant="body2" mb={1}>
            YouTube에서 원하는 영상을 찾습니다
          </Typography>
          <Typography component="li" variant="body2" mb={1}>
            영상 URL을 복사합니다 (예: https://www.youtube.com/watch?v=...)
          </Typography>
          <Typography component="li" variant="body2" mb={1}>
            위 폼에 닉네임과 URL을 입력합니다
          </Typography>
          <Typography component="li" variant="body2" mb={1}>
            &quot;신청하기&quot; 버튼을 클릭합니다
          </Typography>
          <Typography component="li" variant="body2">
            메인 페이지에서 재생 상태를 확인합니다
          </Typography>
        </Box>
      </Card>

      {/* Toast 알림 */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleToastClose} 
          severity={toast.severity} 
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 