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
import {
  PersonAdd,
  Engineering,
  Visibility,
  VisibilityOff,
  Email,
  Phone,
  Person,
  ErrorOutline
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const specialties = [
  'Hardware',
  'Software',
  'Networking',
  'Security',
  'Cloud Services',
  'Database',
  'Web Development',
  'Mobile Development',
  'DevOps',
  'General IT Support'
];

const TechnicianSignup = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialty: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Check if email exists when user finishes typing email
  const handleEmailBlur = async () => {
    if (!formData.email || !formData.email.includes('@')) return;
    
    setCheckingEmail(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/check-email?email=${formData.email}`);
      if (response.data.exists) {
        setEmailExists(true);
      }
    } catch (err) {
      // If the endpoint doesn't exist, we'll just skip this check
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
        specialty: formData.specialty,
        phoneNumber: formData.phoneNumber,
        role: 'technician' // Explicitly set role
      };
      
      await register(userData);
      
      // Redirect to dashboard on successful registration
      navigate('/technician/dashboard');
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
              <Engineering fontSize="large" />
            </Avatar>
            <Typography component="h1" variant="h4" fontWeight="bold" color="primary">
              Technician Registration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Join our technical support team
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
                  label="Full Name"
                  value={formData.username}
                  onChange={handleChange}
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Person color="primary" style={{ marginRight: 8 }} />
                  }}
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
                    startAdornment: <Email color="primary" style={{ marginRight: 8 }} />,
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
                  select
                  fullWidth
                  required
                  name="specialty"
                  label="Technical Specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  helperText="Please select your area of expertise"
                  variant="outlined"
                >
                  {specialties.map((specialty) => (
                    <MenuItem key={specialty} value={specialty}>
                      {specialty}
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
                  InputProps={{
                    startAdornment: <Phone color="primary" style={{ marginRight: 8 }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <Button
                        onClick={() => togglePasswordVisibility('password')}
                        tabIndex={-1}
                        sx={{ minWidth: 'auto', p: 0.5 }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <Button
                        onClick={() => togglePasswordVisibility('confirm')}
                        tabIndex={-1}
                        sx={{ minWidth: 'auto', p: 0.5 }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    )
                  }}
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
                <Link to="/technician/login" style={{ color: theme.palette.primary.main, fontWeight: 'bold', textDecoration: 'none' }}>
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

export default TechnicianSignup;
