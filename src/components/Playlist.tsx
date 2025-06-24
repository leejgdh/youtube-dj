import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import PauseIcon from '@mui/icons-material/Pause';
import AddIcon from '@mui/icons-material/Add';
import { SongRequest } from '../types';

interface PlaylistProps {
  playlist: SongRequest[];
  currentSong: SongRequest | null;
  isPlaying: boolean;
  onPausePlaylist: () => void;
  onResumePlaylist: () => void;
  onStartPlaylist: () => void;
  onPlaySpecificSong: (index: number) => void;
}

export default function Playlist({ 
  playlist, 
  currentSong, 
  isPlaying, 
  onPausePlaylist, 
  onResumePlaylist, 
  onStartPlaylist, 
  onPlaySpecificSong 
}: PlaylistProps) {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card sx={{ p: 3, bgcolor: '#fffde7', mx: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight={700} color="warning.main">
          <QueueMusicIcon sx={{ mr: 1 }} />재생목록 ({playlist.length}곡)
        </Typography>
        <Box display="flex" gap={1}>
          {isPlaying ? (
            <Button
              variant="contained"
              color="warning"
              size="medium"
              startIcon={<PauseIcon />}
              onClick={onPausePlaylist}
            >
              일시정지
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              size="medium"
              startIcon={<PlayArrowIcon />}
              onClick={currentSong ? onResumePlaylist : onStartPlaylist}
              disabled={playlist.length === 0 && !currentSong}
            >
              {currentSong ? '재개' : '재생 시작'}
            </Button>
          )}
        </Box>
      </Box>
      
      {playlist.length === 0 && !currentSong ? (
        <Box textAlign="center" py={4}>
          <Typography color="text.secondary" fontStyle="italic" mb={2}>
            아직 신청된 곡이 없습니다.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => window.open('/request', '_blank')}
          >
            첫 번째 신청곡 등록하기
          </Button>
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" mb={2} fontStyle="italic">
            💡 재생목록의 곡을 클릭하면 해당 곡으로 바로 건너뛸 수 있습니다
          </Typography>
          <List>
            {currentSong && (
              <ListItem sx={{ mb: 2, borderRadius: 2, bgcolor: '#e8f5e8', border: '2px solid #4caf50' }}>
                <ListItemAvatar>
                  <Avatar variant="rounded" src={currentSong.thumbnail} sx={{ width: 64, height: 48, mr: 2 }}>
                    <MusicNoteIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<>
                    <Typography variant="h6" fontWeight={700} color="success.main">
                      🎵 현재 재생: {currentSong.title || '제목 없음'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">신청자: {currentSong.nickname}</Typography>
                  </>}
                  secondary={<>
                    {currentSong.duration && <Typography variant="caption">⏱ {formatDuration(currentSong.duration)}</Typography>}
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {currentSong.timestamp ? new Date(currentSong.timestamp).toLocaleTimeString() : ''}
                    </Typography>
                  </>}
                />
              </ListItem>
            )}
            {playlist.map((song, index) => (
              <ListItem 
                key={song.id} 
                alignItems="flex-start" 
                sx={{ 
                  mb: 1, 
                  borderRadius: 2, 
                  bgcolor: '#f9fbe7',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#e8f5e8',
                    transform: 'translateX(4px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => onPlaySpecificSong(index)}
              >
                <ListItemAvatar>
                  <Avatar variant="rounded" sx={{ width: 48, height: 36, mr: 2, bgcolor: 'primary.main' }}>
                    {index + 1}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<>
                    <Typography variant="subtitle1" fontWeight={700}>{song.title || '제목 없음'}</Typography>
                    <Typography variant="body2" color="text.secondary">신청자: {song.nickname}</Typography>
                  </>}
                  secondary={<>
                    {song.duration && <Typography variant="caption">⏱ {formatDuration(song.duration)}</Typography>}
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {song.timestamp ? new Date(song.timestamp).toLocaleTimeString() : ''}
                    </Typography>
                  </>}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Card>
  );
}
