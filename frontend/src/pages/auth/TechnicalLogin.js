import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider
} from '@mui/material';
import { EngineeringRounded } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_URL } from '../../utils/apiConfig';

const TechnicalLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Using direct axios call to match backend route structure
      console.log('Attempting technical login with:', formData.email);
      console.log('Backend API URL:', `${API_URL}/auth/login`); // Updated to use the correct endpoint
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password
      });
      
      console.log('Login response:', response.data);
      
      const { user, token } = response.data;
      
      // Verify that the user is a technician
      if (user.role !== 'technician') {
        setError('Unauthorized: Technical staff access only');
        // Clear stored data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setLoading(false);
        return;
      }
      
      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set default header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Redirect to technician dashboard
      navigate('/technician');
    } catch (err) {
      console.error('Technical login error:', err);
      setError(err.response?.data?.message || 'Failed to login. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 2
          }}
        >
          <EngineeringRounded sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
          <Typography component="h1" variant="h5" fontWeight="bold" color="success.main">
            Beta Technology Support
          </Typography>
          <Typography component="h2" variant="h6" sx={{ mt: 1 }}>
            Technical Staff Login
          </Typography>
          <Divider sx={{ width: '100%', my: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Technical Email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="success"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default TechnicalLogin;
