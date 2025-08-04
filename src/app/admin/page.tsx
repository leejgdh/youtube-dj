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
  Divider
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  AdminPanelSettings as AdminIcon,
  QueueMusic as QueueIcon
} from '@mui/icons-material';
import { useSocket } from '../../hooks/useSocket';
import { socket } from '../../lib/socket';

export default function AdminPage() {
  const [approvalMode, setApprovalMode] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const { isConnected } = useSocket();

  // Socket.IO를 통해 관리자 상태 및 대기 요청 관리
  useEffect(() => {
    socket.connect();
    
    // 현재 모드 상태 요청
    socket.emit('get-admin-mode');
    
    // 대기 중인 요청 목록 요청
    socket.emit('get-pending-requests');

    // 모드 상태 업데이트 수신
    const handleAdminModeUpdate = (mode: boolean) => {
      setApprovalMode(mode);
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
  }, []);

  const handleModeToggle = () => {
    const newMode = !approvalMode;
    setApprovalMode(newMode);
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

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AdminIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          관리자 페이지
        </Typography>
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
        <Card>
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

      {/* 홈으로 돌아가기 */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          href="/"
          size="large"
        >
          메인 페이지로 돌아가기
        </Button>
      </Box>
    </Box>
  );
}