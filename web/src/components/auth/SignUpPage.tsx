import { useState } from 'react';
import { Alert, Button, Box, TextField, Typography, Avatar, Container, Link } from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import LoopIcon from '@mui/icons-material/Loop';
import { useAuth } from '@/contexts/AuthContext';
import { Link as RouterLink } from 'react-router';

export const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await signUp(email, password);
      setConfirmed(true);
    } catch {
      setError('Could not create account. That email may already be in use.');
    } finally {
      setPassword('');
      setConfirmPassword('');
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <Container component='main' maxWidth='xs'>
        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography component='h1' variant='h5'>Check your email</Typography>
          <Typography color='text.secondary' align='center'>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
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
          {loading ? <LoopIcon /> : <PersonAddOutlinedIcon />}
        </Avatar>
        <Typography component='h1' variant='h5'>
          {loading ? 'Creating account...' : 'Create account'}
        </Typography>
      </Box>

      <Box component='form' onSubmit={handleSignUp} sx={{ mt: 1 }}>
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
        <TextField
          margin='normal'
          required
          fullWidth
          name='password'
          label='Password'
          type='password'
          id='password'
          autoComplete='new-password'
          disabled={loading}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
        />
        <TextField
          margin='normal'
          required
          fullWidth
          name='confirmPassword'
          label='Confirm Password'
          type='password'
          id='confirmPassword'
          autoComplete='new-password'
          disabled={loading}
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
        />

        <Button type='submit' fullWidth variant='contained' sx={{ mt: 3, mb: 2 }} disabled={loading}>
          Create Account
        </Button>

        {error && <Alert severity='error' sx={{ mt: 2 }}>{error}</Alert>}

        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Link component={RouterLink} to='/signin' variant='body2'>
            Already have an account? Sign in
          </Link>
        </Box>

      </Box>

    </Container>
  );
};
