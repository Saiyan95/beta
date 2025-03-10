import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography, 
  Paper,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useTickets } from '../../contexts/TicketContext';
import axios from 'axios';
import { API_URL } from '../../utils/apiConfig';

const TICKET_ENDPOINTS = {
  CREATE: `${API_URL}/tickets`
};

const CreateTicket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addTicket } = useTickets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    productType: '',
    productName: '',
    serialNumber: '',
    warrantyStatus: false,
    warrantyExpiry: '',
    priority: 'medium',
    description: '',
    numberOfUsers: 1
  });

  const validateForm = () => {
    if (!formData.category) {
      setError('Category is required');
      return false;
    }
    if (!formData.description) {
      setError('Description is required');
      return false;
    }
    if (!formData.priority) {
      setError('Priority is required');
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'warrantyStatus' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const submissionData = {
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
        numberOfUsers: parseInt(formData.numberOfUsers, 10) || 1,
        product: {
          name: formData.productName || formData.category || 'Unknown Product',
          type: formData.productType || '',
          serialNumber: formData.serialNumber || '',
          warrantyStatus: {
            inWarranty: formData.warrantyStatus || false,
            expiryDate: formData.warrantyStatus && formData.warrantyExpiry ? formData.warrantyExpiry : null
          }
        },
        clientInfo: {
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          companyName: user?.companyName || '',
          username: user?.username || '',
          department: user?.department || '',
          phoneNumber: user?.phoneNumber || ''
        }
      };
      
      const response = await axios.post(
        TICKET_ENDPOINTS.CREATE,
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.ticket) {
        setSuccess(true);
        addTicket(response.data.ticket);
        
        // Clear form data
        setFormData({
          category: '',
          productType: '',
          productName: '',
          serialNumber: '',
          warrantyStatus: false,
          warrantyExpiry: '',
          priority: 'medium',
          description: '',
          numberOfUsers: 1
        });
        
        // Redirect to client dashboard
        navigate('/client', { state: { refresh: true } });
      } else {
        setError('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      setSuccess(false);
      setError(error.response?.data?.message || 'Error creating ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create Support Ticket
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Ticket created successfully!
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Category *</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <MenuItem value="hardware">Hardware</MenuItem>
                <MenuItem value="software">Software</MenuItem>
                <MenuItem value="network">Network</MenuItem>
                <MenuItem value="security">Security</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              margin="normal"
              name="productType"
              label="Product Type"
              value={formData.productType}
              onChange={handleChange}
            />
            
            <TextField
              fullWidth
              margin="normal"
              name="productName"
              label="Product Name"
              value={formData.productName}
              onChange={handleChange}
            />
            
            <TextField
              fullWidth
              margin="normal"
              name="serialNumber"
              label="Serial Number"
              value={formData.serialNumber}
              onChange={handleChange}
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  name="warrantyStatus"
                  checked={formData.warrantyStatus}
                  onChange={handleChange}
                />
              }
              label="Under Warranty"
              sx={{ mt: 2 }}
            />
            
            {formData.warrantyStatus && (
              <TextField
                fullWidth
                margin="normal"
                name="warrantyExpiry"
                label="Warranty Expiry Date"
                type="date"
                value={formData.warrantyExpiry}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            )}
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Priority *</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              margin="normal"
              name="description"
              label="Description *"
              multiline
              rows={4}
              value={formData.description}
              onChange={handleChange}
              required
            />
            
            <TextField
              fullWidth
              margin="normal"
              name="numberOfUsers"
              label="Number of Users Affected"
              type="number"
              value={formData.numberOfUsers}
              onChange={handleChange}
              InputProps={{ inputProps: { min: 1 } }}
            />
            
            <Box mt={3}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Create Ticket'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateTicket;