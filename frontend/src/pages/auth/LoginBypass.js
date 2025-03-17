import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import { AdminPanelSettings, Security, Done } from '@mui/icons-material';

const LoginBypass = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-execute login bypass on component mount
    bypassLogin();
  }, []);

  const bypassLogin = () => {
    try {
      // Admin token created from our database reset
      const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3Y2FlYmI1MjNiZmIxNzE1NWFiOWUzMyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0MTM1MTg2MSwiZXhwIjoxNzQxOTU2NjYxfQ.qAkbqpzIEiMBzzUq1JBWi0I7CgC9pOlWRL2tuZVDWSE';
      
      // Admin user data
      const adminUser = {
        _id: '67caebb523bfb17155ab9e33',
        username: 'admin',
        email: 'admin@beta-tech.com',
        role: 'admin'
      };
      
      // Save to localStorage
      localStorage.setItem('token', adminToken);
      localStorage.setItem('user', JSON.stringify(adminUser));
      
      // Update status
      setStatus('success');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (err) {
      console.error('Bypass login error:', err);
      setStatus('error');
      setError('Failed to bypass login. Please try again or use regular login.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ pt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Security fontSize="large" sx={{ mb: 2, color: 'warning.main' }} />
        <Typography variant="h5" component="h1" gutterBottom>
          Development Login Bypass
        </Typography>
        
        {status === 'error' && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>
        )}
        
        {status === 'success' ? (
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <Done sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Login Successful!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Redirecting to login...
            </Typography>
            <CircularProgress size={24} sx={{ mt: 2 }} />
          </Box>
        ) : status === 'pending' ? (
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1">
              Bypassing login...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <Button 
              variant="contained" 
              onClick={bypassLogin}
              startIcon={<AdminPanelSettings />}
            >
              Bypass Login (Admin)
            </Button>
          </Box>
        )}
        
        <Divider sx={{ width: '100%', my: 2 }} />
        
        <Typography variant="caption" color="error">
          This is for development purposes only
        </Typography>
        
        <Button 
          variant="text" 
          size="small" 
          onClick={() => navigate('/auth/login')}
          sx={{ mt: 2 }}
        >
          Back to Regular Login
        </Button>
      </Paper>
    </Container>
  );
};

export default LoginBypass;
