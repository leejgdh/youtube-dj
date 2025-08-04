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
  IconButton,
  Button,
  Alert,
  Chip,
  Divider,
  TextField,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  AdminPanelSettings as AdminIcon,
  QueueMusic as QueueIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  DragIndicator as DragIcon,
  SkipNext as SkipIcon,
  Block as BlockIcon
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

// 타입 정의 - SongRequest와 호환되도록 수정
interface Song {
  id: string;
  title?: string;  // SongRequest와 동일하게 옵셔널로 변경
  author?: string;
  nickname: string;
  youtubeUrl: string;
  videoId?: string;  // SongRequest와 동일하게 옵셔널로 변경
  timestamp: Date;  // SongRequest와 동일하게 Date 타입으로 변경
  thumbnail?: string;
}

interface BannedSong {
  id: number;
  youtube_url: string;
  video_id: string;
  title: string;
  author: string;
  banned_at: string;
  banned_by: string;
}

interface ToastState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

interface SongBanResult {
  title: string;
  removedFromPlaylist: boolean;
  removedFromPending: boolean;
  currentSongBanned: boolean;
  message: string;
}

// 드래그 가능한 재생목록 아이템 컴포넌트
function SortablePlaylistItem({ song, index, onRemove, onBan }: { 
  song: Song, 
  index: number, 
  onRemove: (id: string) => void,
  onBan?: (song: Song) => void
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
            {index + 1}. {song.title || '제목 없음'}
          </Typography>
        }
        secondary={
          <Box component="span">
            <Typography variant="body2" color="text.secondary" component="span">
              신청자: {song.nickname}
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary" component="span">
              신청 시간: {song.timestamp instanceof Date ? song.timestamp.toLocaleString('ko-KR') : new Date(song.timestamp).toLocaleString('ko-KR')}
            </Typography>
          </Box>
        }
      />
      
      <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
        {onBan && (
          <IconButton
            aria-label="ban"
            onClick={() => onBan(song)}
            color="warning"
            size="small"
            title="금지곡으로 추가"
          >
            <BlockIcon />
          </IconButton>
        )}
        <IconButton
          edge="end"
          aria-label="remove"
          onClick={() => onRemove(song.id)}
          color="error"
          size="small"
          title="재생목록에서 제거"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </ListItem>
  );
}

export default function AdminPage() {
  const [approvalMode, setApprovalMode] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Song[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [bannedSongs, setBannedSongs] = useState<BannedSong[]>([]);
  const [showBanConfirmDialog, setShowBanConfirmDialog] = useState(false);
  const [songToBan, setSongToBan] = useState<Song | null>(null);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info'
  });
  const { isConnected, playlist, currentSong } = useSocket();

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    } catch {
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
    
    // 금지곡 목록 로드
    loadBannedSongs();

    // 모드 상태 업데이트 수신
    const handleAdminModeUpdate = (mode: boolean) => {
      setApprovalMode(mode);
      // localStorage에 저장
      localStorage.setItem('youtube-dj-admin-mode', mode.toString());
    };

    // 대기 요청 목록 업데이트 수신
    const handlePendingRequestsUpdate = (requests: Song[]) => {
      setPendingRequests(requests);
    };

    // 금지곡 등록 결과 알림 수신
    const handleSongBanResult = (result: SongBanResult) => {
      showToast(result.message, 'success');
    };

    socket.on('admin-mode-updated', handleAdminModeUpdate);
    socket.on('pending-requests-updated', handlePendingRequestsUpdate);
    socket.on('song-ban-result', handleSongBanResult);

    return () => {
      socket.off('admin-mode-updated', handleAdminModeUpdate);
      socket.off('pending-requests-updated', handlePendingRequestsUpdate);
      socket.off('song-ban-result', handleSongBanResult);
    };
  }, [isAuthenticated]);

  // 금지곡 목록 로드
  const loadBannedSongs = async () => {
    try {
      const response = await fetch('/api/admin/banned-songs');
      if (response.ok) {
        const data = await response.json();
        setBannedSongs(data.bannedSongs);
      }
    } catch (error) {
      console.error('Error loading banned songs:', error);
    }
  };

  // 금지곡으로 추가
  const handleBanSong = async (song: Song) => {
    try {
      const response = await fetch('/api/admin/banned-songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeUrl: song.youtubeUrl,
          videoId: song.videoId || '',
          title: song.title || '제목 없음',
          author: song.author || '알 수 없음'
        }),
      });

      if (response.ok) {
        await loadBannedSongs();
        setShowBanConfirmDialog(false);
        setSongToBan(null);
        
        // 소켓으로 금지곡 추가 알림 (목록에서 제거하기 위해)
        socket.emit('song-banned', {
          youtubeUrl: song.youtubeUrl,
          videoId: song.videoId || '',
          title: song.title || '제목 없음',
          author: song.author || '알 수 없음'
        });
      } else {
        const data = await response.json();
        showToast(data.error || '금지곡 추가에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error banning song:', error);
      showToast('금지곡 추가 중 오류가 발생했습니다.', 'error');
    }
  };

  // 금지곡에서 제거
  const handleUnbanSong = async (songId: number) => {
    try {
      const response = await fetch(`/api/admin/banned-songs?id=${songId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadBannedSongs();
      } else {
        showToast('금지곡 제거에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error unbanning song:', error);
      showToast('금지곡 제거 중 오류가 발생했습니다.', 'error');
    }
  };

  // 금지곡 추가 확인 다이얼로그 열기
  const openBanConfirmDialog = (song: Song) => {
    setSongToBan(song);
    setShowBanConfirmDialog(true);
  };

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
  const handleReorderPlaylist = (newPlaylist: Song[]) => {
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
                size="medium"
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

      {/* 탭 네비게이션 */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
        >
          <Tab 
            icon={<QueueIcon />} 
            label="재생목록 관리" 
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          <Tab 
            icon={<BlockIcon />} 
            label="금지곡 관리" 
            id="tab-1"
            aria-controls="tabpanel-1"
          />
        </Tabs>
      </Card>

      {/* 탭 패널 0: 재생목록 관리 */}
      {currentTab === 0 && (
        <>
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
                {pendingRequests.map((request) => (
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
                          {request.title || '제목 없음'}
                        </Typography>
                      }
                      secondary={
                        <Box component="span">
                          <Typography variant="body2" color="text.secondary" component="span">
                            신청자: {request.nickname}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary" component="span">
                            신청 시간: {request.timestamp instanceof Date ? request.timestamp.toLocaleString('ko-KR') : new Date(request.timestamp).toLocaleString('ko-KR')}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                      <IconButton
                        aria-label="approve"
                        onClick={() => handleApproveRequest(request.id)}
                        color="success"
                        size="small"
                        title="승인"
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        aria-label="ban"
                        onClick={() => openBanConfirmDialog(request)}
                        color="warning"
                        size="small"
                        title="금지곡으로 추가"
                      >
                        <BlockIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="reject"
                        onClick={() => handleRejectRequest(request.id)}
                        color="error"
                        size="small"
                        title="거부"
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
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
                {currentSong.title || '제목 없음'}
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
                        onBan={openBanConfirmDialog}
                      />
                    ))}
                  </List>
                </SortableContext>
              </DndContext>
            </Box>
          )}
        </CardContent>
      </Card>
        </>
      )}

      {/* 탭 패널 1: 금지곡 관리 */}
      {currentTab === 1 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BlockIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                금지곡 목록
              </Typography>
              <Chip 
                label={bannedSongs.length} 
                color="error" 
                size="small" 
                sx={{ ml: 1 }}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {bannedSongs.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                등록된 금지곡이 없습니다.
              </Typography>
            ) : (
              <List>
                {bannedSongs.map((song: BannedSong) => (
                  <ListItem key={song.id} sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1, 
                    mb: 1, 
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}>
                    <ListItemText
                      primary={song.title}
                      secondary={
                        <Box component="span">
                          <Typography variant="body2" color="text.secondary" component="span">
                            채널: {song.author}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary" component="span">
                            등록일: {new Date(song.banned_at).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleUnbanSong(song.id)}
                      title="금지곡에서 제거"
                      sx={{ ml: 'auto' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {/* 금지곡 추가 확인 다이얼로그 */}
      <Dialog 
        open={showBanConfirmDialog} 
        onClose={() => setShowBanConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BlockIcon sx={{ mr: 1, color: 'error.main' }} />
            금지곡으로 등록
          </Box>
        </DialogTitle>
        <DialogContent>
          {songToBan && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {songToBan.title || '제목 없음'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                채널: {songToBan.author || '알 수 없음'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                이 곡을 금지곡으로 등록하시겠습니까?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                금지곡으로 등록하면 앞으로 이 곡은 신청할 수 없습니다.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBanConfirmDialog(false)}>
            취소
          </Button>
          <Button 
            onClick={() => songToBan && handleBanSong(songToBan)} 
            color="error" 
            variant="contained"
            disabled={!songToBan}
          >
            금지곡으로 등록
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast 알림 */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert 
          onClose={handleToastClose} 
          severity={toast.severity} 
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {toast.message}
        </MuiAlert>
      </Snackbar>

    </Box>
  );
}