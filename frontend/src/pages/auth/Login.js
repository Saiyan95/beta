import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import { AccountCircle, SupportAgent } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Parse query parameters on mount to pre-fill email
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const email = params.get('email');
    
    if (email) {
      setFormData(prev => ({ ...prev, identifier: email }));
      setSuccessMessage('Registration successful! Please enter your password to continue.');
    }
  }, [location]);

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
      console.log('Attempting client login with:', formData.identifier);
      const user = await login(formData.identifier, formData.password);
      
      if (!user) {
        setError('Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }
      
      // Check if user is a client
      if (user.role !== 'client') {
        setError('This is not a client account. Please go to the staff login page.');
        setLoading(false);
        return;
      }

      // Redirect to client dashboard
      navigate('/client');
      
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      padding: 3
    }}>
      <Box sx={{ 
        textAlign: 'center', 
        mb: 4, 
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <SupportAgent sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h3" gutterBottom fontWeight="bold">
          Beta Tech Support
        </Typography>
        <Typography variant="subtitle1">
          Get professional support for all your technical needs
        </Typography>
      </Box>

      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
          <Box sx={{
            bgcolor: theme.palette.primary.main,
            color: 'white',
            width: 80,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            mb: 3,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.5)'
          }}>
            <AccountCircle fontSize="large" />
          </Box>
          
          <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
            Client Login
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 400 }}>
            Access your support tickets and request technical assistance
          </Typography>
          
          {error && <Alert severity="error" sx={{ width: '100%', mb: 3 }}>{error}</Alert>}
          {successMessage && <Alert severity="success" sx={{ width: '100%', mb: 3 }}>{successMessage}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="identifier"
              label="Username or Email Address"
              name="identifier"
              autoComplete="username email"
              autoFocus
              value={formData.identifier}
              onChange={handleChange}
              placeholder="your-username or your-email@example.com"
              sx={{ mb: 2 }}
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
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 1, 
                mb: 3, 
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                <Link to="/forgot-password" style={{ textDecoration: 'none', color: theme.palette.primary.main }}>
                  Forgot password?
                </Link>
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link to="/register" style={{
                  textDecoration: 'none',
                  color: theme.palette.primary.main,
                  fontWeight: 'bold'
                }}>
                  Sign up
                </Link>
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Are you a staff member?{' '}
                <Button
                  onClick={() => navigate('/staff-login')}
                  sx={{
                    textTransform: 'none',
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Login here
                </Button>
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Need to bypass login?{' '}
                <Link to="/login-bypass" style={{ textDecoration: 'none' }}>
                  Click here
                </Link>
              </Typography>
            </Box>
            
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Development Only
                  </Typography>
                </Divider>
                <Link to="/auth/login-bypass" style={{ textDecoration: 'none' }}>
                  <Button size="small" color="secondary">
                    Bypass Login (Dev)
                  </Button>
                </Link>
                
                <Card variant="outlined" sx={{ mt: 2, textAlign: 'left', bgcolor: theme.palette.background.lightBlue }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" fontWeight="bold">
                      Demo Client Account
                    </Typography>
                    <Typography variant="caption" display="block" gutterBottom>
                      Email: client@example.com
                    </Typography>
                    <Typography variant="caption" display="block">
                      Password: 123456
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
