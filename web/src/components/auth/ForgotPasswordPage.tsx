import { useState } from 'react';
import { Alert, Button, Box, TextField, Typography, Avatar, Container, Link } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import LoopIcon from '@mui/icons-material/Loop';
import { useAuth } from '@/contexts/AuthContext';
import { Link as RouterLink } from 'react-router';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      setError('Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Container component='main' maxWidth='xs'>
        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography component='h1' variant='h5'>Check your email</Typography>
          <Typography color='text.secondary' align='center'>
            If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
          </Typography>
          <Link component={RouterLink} to='/signin'>Back to sign in</Link>
        </Box>
      </Container>
    );
  }

  return (
    <Container component='main' maxWidth='xs'>

      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          {loading ? <LoopIcon /> : <LockResetIcon />}
        </Avatar>
        <Typography component='h1' variant='h5'>
          {loading ? 'Sending...' : 'Reset password'}
        </Typography>
        <Typography color='text.secondary' align='center' sx={{ mt: 1 }}>
          Enter your email and we'll send you a reset link.
        </Typography>
      </Box>

      <Box component='form' onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <TextField
          margin='normal'
          required
          fullWidth
          id='email'
          label='Email Address'
          type='email'
          name='email'
          autoComplete='email'
          autoFocus
          disabled={loading}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
        />

        <Button type='submit' fullWidth variant='contained' sx={{ mt: 3, mb: 2 }} disabled={loading}>
          Send Reset Link
        </Button>

        {error && <Alert severity='error' sx={{ mt: 2 }}>{error}</Alert>}

        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Link component={RouterLink} to='/signin' variant='body2'>
            Back to sign in
          </Link>
        </Box>

      </Box>

    </Container>
  );
};
