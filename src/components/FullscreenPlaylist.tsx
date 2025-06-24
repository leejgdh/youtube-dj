import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { SongRequest } from '../types';

interface FullscreenPlaylistProps {
  playlist: SongRequest[];
  onToggleFullscreen: () => void;
  onPlaySpecificSong: (index: number) => void;
}

export default function FullscreenPlaylist({ 
  playlist, 
  onToggleFullscreen, 
  onPlaySpecificSong 
}: FullscreenPlaylistProps) {
  return (
    <Box 
      sx={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        p: 2,
        zIndex: 10000,
        maxHeight: '120px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" color="white" mb={1} fontWeight={600}>
          🎵 다음 곡들 ({playlist.length}곡)
        </Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 2, 
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: '4px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '2px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '2px',
              '&:hover': {
                background: 'rgba(255,255,255,0.5)'
              }
            }
          }}
        >
          {playlist.slice(0, 20).map((song, index) => (
            <Box 
              key={song.id}
              onClick={() => onPlaySpecificSong(index)}
              sx={{ 
                minWidth: '180px',
                maxWidth: '180px',
                flex: '0 0 auto',
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                p: 1,
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                  transform: 'translateY(-2px)',
                  border: '1px solid rgba(255,255,255,0.4)'
                }
              }}
            >
              <Typography 
                variant="caption" 
                color="white" 
                sx={{ 
                  fontWeight: 600,
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.75rem',
                  lineHeight: 1.2
                }}
              >
                {index + 1}. {song.title || '제목 없음'}
              </Typography>
              <Typography 
                variant="caption" 
                color="rgba(255,255,255,0.7)"
                sx={{ 
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.7rem',
                  lineHeight: 1.2
                }}
              >
                신청자: {song.nickname}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Button
        variant="outlined"
        color="secondary"
        onClick={onToggleFullscreen}
        sx={{
          ml: 2,
          height: '48px',
          width: '48px',
          minWidth: '48px',
          alignSelf: 'flex-end',
          color: 'white',
          borderColor: 'white',
          '&:hover': {
            borderColor: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)'
          }
        }}
      >
        <FullscreenExitIcon />
      </Button>
    </Box>
  );
}
