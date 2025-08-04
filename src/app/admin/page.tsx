'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Alert,
  Chip,
  Divider,
  TextField
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  AdminPanelSettings as AdminIcon,
  QueueMusic as QueueIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  DragIndicator as DragIcon,
  SkipNext as SkipIcon
} from '@mui/icons-material';
import { useSocket } from '../../hooks/useSocket';
import { socket } from '../../lib/socket';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 드래그 가능한 재생목록 아이템 컴포넌트
function SortablePlaylistItem({ song, index, onRemove }: { 
  song: any, 
  index: number, 
  onRemove: (id: string) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        bgcolor: 'background.paper',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          display: 'flex',
          alignItems: 'center',
          mr: 2,
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      >
        <DragIcon color="action" />
      </Box>
      
      <ListItemText
        primary={
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {index + 1}. {song.title}
          </Typography>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              신청자: {song.nickname}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              신청 시간: {new Date(song.timestamp).toLocaleString('ko-KR')}
            </Typography>
          </Box>
        }
      />
      
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          aria-label="remove"
          onClick={() => onRemove(song.id)}
          color="error"
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
}

export default function AdminPage() {
  const [approvalMode, setApprovalMode] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { isConnected, playlist, currentSong } = useSocket();

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 페이지 로드 시 인증 상태 확인
  useEffect(() => {
    const authStatus = localStorage.getItem('youtube-dj-admin-auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('youtube-dj-admin-auth', 'true');
        setLoginForm({ username: '', password: '' });
      } else {
        setLoginError(data.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      setLoginError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('youtube-dj-admin-auth');
    setLoginForm({ username: '', password: '' });
  };

  // Socket.IO를 통해 관리자 상태 및 대기 요청 관리
  useEffect(() => {
    if (!isAuthenticated) return;
    socket.connect();
    
    // localStorage에서 저장된 모드 확인
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
    
    // 대기 중인 요청 목록 요청
    socket.emit('get-pending-requests');

    // 모드 상태 업데이트 수신
    const handleAdminModeUpdate = (mode: boolean) => {
      setApprovalMode(mode);
      // localStorage에 저장
      localStorage.setItem('youtube-dj-admin-mode', mode.toString());
    };

    // 대기 요청 목록 업데이트 수신
    const handlePendingRequestsUpdate = (requests: any[]) => {
      setPendingRequests(requests);
    };

    socket.on('admin-mode-updated', handleAdminModeUpdate);
    socket.on('pending-requests-updated', handlePendingRequestsUpdate);

    return () => {
      socket.off('admin-mode-updated', handleAdminModeUpdate);
      socket.off('pending-requests-updated', handlePendingRequestsUpdate);
    };
  }, [isAuthenticated]);

  const handleModeToggle = () => {
    const newMode = !approvalMode;
    setApprovalMode(newMode);
    // localStorage에 저장
    localStorage.setItem('youtube-dj-admin-mode', newMode.toString());
    socket.emit('set-admin-mode', newMode);
  };

  const handleApproveRequest = (requestId: string) => {
    socket.emit('approve-request', requestId);
  };

  const handleRejectRequest = (requestId: string) => {
    socket.emit('reject-request', requestId);
  };

  const clearAllPendingRequests = () => {
    socket.emit('clear-pending-requests');
  };

  // 재생목록에서 곡 제거
  const handleRemoveFromPlaylist = (songId: string) => {
    socket.emit('remove-from-playlist', songId);
  };

  // 현재 재생 중인 곡 건너뛰기
  const handleSkipCurrentSong = () => {
    socket.emit('admin-skip-current');
  };

  // 재생목록 순서 변경
  const handleReorderPlaylist = (newPlaylist: any[]) => {
    socket.emit('reorder-playlist', newPlaylist);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = playlist.findIndex((item) => item.id === active.id);
      const newIndex = playlist.findIndex((item) => item.id === over?.id);

      const newPlaylist = arrayMove(playlist, oldIndex, newIndex);
      handleReorderPlaylist(newPlaylist);
    }
  };

  // 로그인되지 않은 경우 로그인 폼 표시
  if (!isAuthenticated) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', p: 3, mt: 8 }}>
        <Card sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <AdminIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              관리자 로그인
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="아이디"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              margin="normal"
              required
              disabled={isLoggingIn}
              autoComplete="username"
            />
            <TextField
              fullWidth
              label="비밀번호"
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              margin="normal"
              required
              disabled={isLoggingIn}
              autoComplete="current-password"
            />

            {loginError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {loginError}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? '로그인 중...' : '로그인'}
            </Button>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button 
              variant="text" 
              href="/"
              size="small"
            >
              메인 페이지로 돌아가기
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AdminIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            관리자 페이지
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          color="secondary" 
          onClick={handleLogout}
        >
          로그아웃
        </Button>
      </Box>

      {/* 연결 상태 표시 */}
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          서버와의 연결이 끊어졌습니다. 기능이 제한될 수 있습니다.
        </Alert>
      )}

      {/* 모드 설정 카드 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            신청곡 모드 설정
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={approvalMode}
                onChange={handleModeToggle}
                color="primary"
                size="large"
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {approvalMode ? '승인 모드' : '자유 모드'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {approvalMode 
                    ? '신청곡이 관리자 승인 후 재생목록에 추가됩니다.'
                    : '신청곡이 바로 재생목록에 추가됩니다.'
                  }
                </Typography>
              </Box>
            }
          />
        </CardContent>
      </Card>

      {/* 승인 대기 목록 (승인 모드일 때만 표시) */}
      {approvalMode && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <QueueIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  승인 대기 목록
                </Typography>
                <Chip 
                  label={pendingRequests.length} 
                  color="secondary" 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Box>
              {pendingRequests.length > 0 && (
                <Button 
                  variant="outlined" 
                  color="error" 
                  size="small"
                  onClick={clearAllPendingRequests}
                >
                  전체 삭제
                </Button>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {pendingRequests.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                승인 대기 중인 신청곡이 없습니다.
              </Typography>
            ) : (
              <List>
                {pendingRequests.map((request, index) => (
                  <ListItem 
                    key={request.id}
                    sx={{ 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {request.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            신청자: {request.nickname}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            신청 시간: {new Date(request.timestamp).toLocaleString('ko-KR')}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="approve"
                        onClick={() => handleApproveRequest(request.id)}
                        color="success"
                        sx={{ mr: 1 }}
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="reject"
                        onClick={() => handleRejectRequest(request.id)}
                        color="error"
                      >
                        <CloseIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {/* 현재 재생 중인 곡 */}
      {currentSong && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PlayIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  현재 재생 중
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small"
                startIcon={<SkipIcon />}
                onClick={handleSkipCurrentSong}
              >
                건너뛰기
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ 
              p: 2, 
              border: '2px solid',
              borderColor: 'primary.main',
              borderRadius: 1,
              bgcolor: 'primary.50'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {currentSong.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                신청자: {currentSong.nickname}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 재생목록 관리 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <QueueIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                재생목록 관리
              </Typography>
              <Chip 
                label={playlist.length} 
                color="primary" 
                size="small" 
                sx={{ ml: 1 }}
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {playlist.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              재생목록이 비어있습니다.
            </Typography>
          ) : (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                💡 드래그하여 순서를 변경할 수 있습니다
              </Typography>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={playlist.map(song => song.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <List>
                    {playlist.map((song, index) => (
                      <SortablePlaylistItem
                        key={song.id}
                        song={song}
                        index={index}
                        onRemove={handleRemoveFromPlaylist}
                      />
                    ))}
                  </List>
                </SortableContext>
              </DndContext>
            </Box>
          )}
        </CardContent>
      </Card>

    </Box>
  );
}