import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

interface HeaderProps {
  isConnected: boolean;
  onLogout?: () => void;
}

export default function Header({ isConnected, onLogout }: HeaderProps) {
  return (
    <>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} px={2}>
        <Typography variant="h4" fontWeight={700}>
          <MusicNoteIcon fontSize="large" sx={{ verticalAlign: 'middle', mr: 1 }} />
          YouTube DJ
        </Typography>
        {onLogout && (
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={onLogout}
            size="small"
          >
            로그아웃
          </Button>
        )}
      </Box>

      {/* 연결 상태 */}
      <Box textAlign="center" mb={2}>
        <Typography variant="body1" color={isConnected ? 'success.main' : 'error.main'}>
          {isConnected ? '🟢 서버 연결됨' : '🔴 서버 연결 안됨'}
        </Typography>
      </Box>
    </>
  );
}
