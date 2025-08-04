'use client';

import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormProps {
  title: string;
  icon: React.ReactNode;
}

export default function LoginForm({ title, icon }: LoginFormProps) {
  const { loginForm, loginError, isLoggingIn, setLoginForm, handleLogin } = useAuth();

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3, mt: 8 }}>
      <Card sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          {icon}
          <Typography variant="h4" component="h1">
            {title}
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
      </Card>
    </Box>
  );
}