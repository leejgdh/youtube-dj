'use client';

import {
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';

interface SongData {
  id: string;
  title?: string;
  author?: string;
  nickname: string;
  youtubeUrl: string;
  videoId?: string;
  timestamp: Date | string;
  thumbnail?: string;
}

interface BannedSongData {
  id: number;
  youtube_url: string;
  video_id: string;
  title: string;
  author: string;
  banned_at: string;
  banned_by: string;
}

interface ActionButton {
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  title?: string;
}

interface SongListItemProps {
  song: SongData | BannedSongData;
  index?: number;
  showIndex?: boolean;
  isDraggable?: boolean;
  actions: ActionButton[];
  dragHandleProps?: any;
  itemStyles?: any;
}

// 타입 가드 함수들
const isSongData = (song: SongData | BannedSongData): song is SongData => {
  return 'nickname' in song;
};

const isBannedSongData = (song: SongData | BannedSongData): song is BannedSongData => {
  return 'banned_at' in song;
};

export default function SongListItem({
  song,
  index,
  showIndex = false,
  isDraggable = false,
  actions,
  dragHandleProps,
  itemStyles = {}
}: SongListItemProps) {
  
  const getTitle = () => {
    if (isSongData(song)) {
      return song.title || '제목 없음';
    }
    return song.title;
  };

  const getSecondaryInfo = () => {
    if (isSongData(song)) {
      const timeStr = song.timestamp instanceof Date 
        ? song.timestamp.toLocaleString('ko-KR')
        : new Date(song.timestamp).toLocaleString('ko-KR');
      
      return (
        <Box component="span">
          <Typography variant="body2" color="text.secondary" component="span">
            신청자: {song.nickname}
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary" component="span">
            신청 시간: {timeStr}
          </Typography>
        </Box>
      );
    }
    
    if (isBannedSongData(song)) {
      return (
        <Box component="span">
          <Typography variant="body2" color="text.secondary" component="span">
            채널: {song.author}
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary" component="span">
            등록일: {new Date(song.banned_at).toLocaleString()}
          </Typography>
        </Box>
      );
    }
    
    return null;
  };

  const defaultItemStyles = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    mb: 1,
    bgcolor: 'background.paper',
    ...itemStyles
  };

  return (
    <ListItem sx={defaultItemStyles}>
      {/* 드래그 핸들 */}
      {isDraggable && dragHandleProps && (
        <Box
          {...dragHandleProps}
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
      )}
      
      {/* 곡 정보 */}
      <ListItemText
        primary={
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {showIndex && typeof index === 'number' ? `${index + 1}. ` : ''}{getTitle()}
          </Typography>
        }
        secondary={getSecondaryInfo()}
      />
      
      {/* 액션 버튼들 */}
      <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
        {actions.map((action, idx) => (
          <IconButton
            key={idx}
            aria-label={`action-${idx}`}
            onClick={action.onClick}
            color={action.color || 'default'}
            size="small"
            title={action.title}
          >
            {action.icon}
          </IconButton>
        ))}
      </Box>
    </ListItem>
  );
}

// 편의를 위한 액션 생성 함수들
export const createApproveAction = (onApprove: () => void): ActionButton => ({
  icon: <CheckIcon />,
  onClick: onApprove,
  color: 'success',
  title: '승인'
});

export const createRejectAction = (onReject: () => void): ActionButton => ({
  icon: <CloseIcon />,
  onClick: onReject,
  color: 'error',
  title: '거부'
});

export const createBanAction = (onBan: () => void): ActionButton => ({
  icon: <BlockIcon />,
  onClick: onBan,
  color: 'warning',
  title: '금지곡으로 추가'
});

export const createDeleteAction = (onDelete: () => void): ActionButton => ({
  icon: <DeleteIcon />,
  onClick: onDelete,
  color: 'error',
  title: '삭제'
});

export const createRemoveAction = (onRemove: () => void): ActionButton => ({
  icon: <DeleteIcon />,
  onClick: onRemove,
  color: 'error',
  title: '재생목록에서 제거'
});