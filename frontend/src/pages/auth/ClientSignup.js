import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
  MenuItem,
  useTheme,
  alpha,
  Avatar,
  Divider,
  CircularProgress
} from '@mui/material';
import { PersonAdd, Business, ErrorOutline } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const departments = [
  'IT',
  'Finance',
  'Human Resources',
  'Marketing',
  'Sales',
  'Operations',
  'Research & Development',
  'Customer Service',
  'Legal',
  'Other'
];

const ClientSignup = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { register, checkEmailExists } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    department: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Reset email exists error when email is changed
    if (name === 'email' && emailExists) {
      setEmailExists(false);
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Check if email exists when user finishes typing email
  const handleEmailBlur = async () => {
    if (!formData.email || !formData.email.includes('@')) return;
    
    setCheckingEmail(true);
    try {
      const exists = await checkEmailExists(formData.email);
      setEmailExists(exists);
    } catch (err) {
      console.log('Email check failed:', err);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Don't proceed if email already exists
    if (emailExists) {
      return;
    }
    
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Use the register function from useAuth hook
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        department: formData.department,
        phoneNumber: formData.phoneNumber,
        role: 'client' // Explicitly set role
      };
      
      await register(userData);
      
      // Redirect to dashboard on successful registration
      navigate('/client/dashboard');
    } catch (err) {
      console.error('Signup error:', err.response || err);
      
      // Check if the error is because email already exists
      if (err.response?.data?.message === 'User already exists') {
        setEmailExists(true);
      } else {
        setError(err.response?.data?.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.9)} 100%)`,
        py: 4
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper 
          elevation={6} 
          sx={{ 
            p: { xs: 3, md: 4 }, 
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3
            }}
          >
            <Avatar
              sx={{
                width: 60,
                height: 60,
                bgcolor: theme.palette.primary.main,
                mb: 2,
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
              }}
            >
              <PersonAdd fontSize="large" />
            </Avatar>
            <Typography component="h1" variant="h4" fontWeight="bold" color="primary">
              Client Registration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Create your client account to get started
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  name="username"
                  label="Username"
                  value={formData.username}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  variant="outlined"
                  error={emailExists}
                  helperText={emailExists ? 'This email is already registered. Please use a different email.' : ''}
                  InputProps={{
                    endAdornment: checkingEmail ? (
                      <CircularProgress size={20} color="primary" />
                    ) : emailExists ? (
                      <ErrorOutline color="error" />
                    ) : null
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  name="companyName"
                  label="Company Name"
                  value={formData.companyName}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  required
                  name="department"
                  label="Department"
                  value={formData.department}
                  onChange={handleChange}
                  helperText="Please select your department"
                  variant="outlined"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  name="phoneNumber"
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  name="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: 4, 
                mb: 3, 
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold',
                fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
              disabled={loading || emailExists}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link to="/client/login" style={{ color: theme.palette.primary.main, fontWeight: 'bold', textDecoration: 'none' }}>
                  Sign In
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default ClientSignup;
