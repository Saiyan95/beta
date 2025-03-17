import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import { AdminPanelSettings, EngineeringOutlined, SupportAgent } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_URL } from '../../utils/apiConfig';

const StaffLogin = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [userType, setUserType] = useState('technician');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUserTypeChange = (e, newValue) => {
    setUserType(newValue);
  };

  // Direct login function to bypass context and troubleshoot the issue
  const directLoginAttempt = async () => {
    try {
      setDebugInfo('Attempting direct axios login...');
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password
      });
      
      setDebugInfo(prev => prev + '\nDirect login response: ' + JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      setDebugInfo(prev => prev + '\nDirect login error: ' + (error.response?.data?.message || error.message));
      return null;
    }
  };

  // Use admin credentials directly
  const useAdminCredentials = () => {
    setFormData({
      email: 'admin@beta-tech.com',
      password: 'admin123'
    });
    setUserType('admin');
    setDebugInfo('Admin credentials applied');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebugInfo('Login attempt initiated');

    try {
      console.log(`Attempting ${userType} login with:`, formData.email);
      setDebugInfo(prev => prev + `\nAttempting ${userType} login with: ${formData.email}`);
      
      // Try direct login first to debug
      await directLoginAttempt();
      setDebugInfo(prev => prev + '\nDirect login complete, attempting context login...');
      
      const user = await login(formData.email, formData.password);
      
      if (!user) {
        setError('Login failed. Please check your credentials.');
        setDebugInfo(prev => prev + '\nLogin failed: No user returned from context');
        setLoading(false);
        return;
      }
      
      // Check if user role matches selected user type
      if (userType === 'admin' && user.role !== 'admin') {
        setError('This account does not have admin privileges');
        setDebugInfo(prev => prev + `\nRole mismatch: Expected admin, got ${user.role}`);
        setLoading(false);
        return;
      } else if (userType === 'technician' && user.role !== 'technical') {
        setError('This account does not have technical staff privileges');
        setDebugInfo(prev => prev + `\nRole mismatch: Expected technician, got ${user.role}`);
        setLoading(false);
        return;
      }

      // Check if user is a client trying to access staff login
      if (user.role === 'client') {
        setError('Client accounts should use the client login page');
        setDebugInfo(prev => prev + '\nDetected client role on staff login page');
        setLoading(false);
        return;
      }

      setDebugInfo(prev => prev + '\nLogin successful! Redirecting...');
      
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'technical') {
        navigate('/technician');
      }
      
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      setDebugInfo(prev => prev + '\nCaught exception: ' + (error.response?.data?.message || error.message));
      setError(error.response?.data?.message || 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeInfo = () => {
    switch(userType) {
      case 'admin':
        return {
          icon: <AdminPanelSettings fontSize="large" sx={{ mb: 2, color: 'error.main' }} />,
          title: 'Administrator Login',
          description: 'Access the admin dashboard to manage users, tickets, and system settings.',
          placeholder: 'admin@beta-tech.com',
          color: theme.palette.error.main,
          bgColor: theme.palette.error.light,
          buttonColor: 'error'
        };
      case 'technician':
        return {
          icon: <EngineeringOutlined fontSize="large" sx={{ mb: 2, color: 'info.main' }} />,
          title: 'Technical Staff Login',
          description: 'Access your assigned tickets and provide technical support to clients.',
          placeholder: 'tech@example.com',
          color: theme.palette.info.main,
          bgColor: theme.palette.info.light,
          buttonColor: 'primary'
        };
      default:
        return {
          icon: <EngineeringOutlined fontSize="large" sx={{ mb: 2 }} />,
          title: 'Staff Login',
          description: 'Access the staff portal',
          placeholder: 'staff@example.com',
          color: theme.palette.primary.main,
          bgColor: theme.palette.primary.light,
          buttonColor: 'primary'
        };
    }
  };

  const userTypeInfo = getUserTypeInfo();

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
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
          Staff Portal
        </Typography>
      </Box>

      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ 
          p: 0, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden'
        }}>
          <Tabs
            value={userType}
            onChange={handleUserTypeChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            aria-label="user type tabs"
            sx={{
              bgcolor: theme.palette.background.lightBlue,
              '& .MuiTab-root': {
                py: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }
            }}
          >
            <Tab 
              icon={<EngineeringOutlined />} 
              label="Technical Staff" 
              value="technician"
              sx={{ py: 2 }}
            />
            <Tab 
              icon={<AdminPanelSettings />} 
              label="Administrator" 
              value="admin"
              sx={{ py: 2 }}
            />
          </Tabs>
          
          <Box sx={{ p: 4 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3
            }}>
              <Box sx={{
                bgcolor: userTypeInfo.color,
                color: 'white',
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                mb: 3,
                boxShadow: `0 4px 12px ${userTypeInfo.color}80`
              }}>
                {userTypeInfo.icon}
              </Box>
              
              <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
                {userTypeInfo.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
                {userTypeInfo.description}
              </Typography>
            </Box>
            
            {error && <Alert severity="error" sx={{ width: '100%', mb: 3 }}>{error}</Alert>}
            
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                placeholder={userTypeInfo.placeholder}
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
                color={userTypeInfo.buttonColor}
                sx={{ 
                  mt: 1, 
                  mb: 3, 
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: `0 4px 12px ${userTypeInfo.color}40`,
                  '&:hover': {
                    boxShadow: `0 6px 16px ${userTypeInfo.color}60`,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
              
              <Button
                fullWidth
                onClick={useAdminCredentials}
                variant="outlined"
                color="secondary"
                size="medium"
                sx={{ mt: 2 }}
              >
                Use Admin Credentials
              </Button>
              
              <Divider sx={{ my: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Debug Info
                </Typography>
              </Divider>
              
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  maxHeight: '150px', 
                  overflow: 'auto',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              >
                <pre>{debugInfo}</pre>
              </Paper>
              
              <Divider sx={{ my: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Are you a client?
                </Typography>
              </Divider>
              
              <Box sx={{ textAlign: 'center' }}>
                <Button 
                  variant="outlined" 
                  size="medium"
                  onClick={() => navigate('/auth/login')}
                  sx={{ 
                    px: 3,
                    borderRadius: 2,
                    fontWeight: 500
                  }}
                >
                  Go to Client Login
                </Button>
              </Box>
              
              {process.env.NODE_ENV === 'development' && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Development Options
                    </Typography>
                  </Divider>
                  <Link to="/auth/login-bypass" style={{ textDecoration: 'none' }}>
                    <Button size="small" color="secondary">
                      Bypass Login (Dev)
                    </Button>
                  </Link>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default StaffLogin;
