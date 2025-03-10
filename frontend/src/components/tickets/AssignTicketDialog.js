import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import axios from 'axios';
import { USER_ENDPOINTS, TICKET_ENDPOINTS } from '../../utils/apiConfig';
import { useTickets } from '../../contexts/TicketContext';

const AssignTicketDialog = ({ open, handleClose, ticketId, onSuccess }) => {
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [localTechnicians, setLocalTechnicians] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { assignTicket } = useTickets();

  // Directly fetch technicians from the API when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTechnician('');
      setError(null);
      fetchTechnicians();
    }
  }, [open]);

  // Direct implementation of fetchTechnicians to ensure it works
  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      console.log('Directly fetching technicians...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(USER_ENDPOINTS.GET_TECHNICIANS, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Technicians API response:', response.data);
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Ensure each technician has the required fields
        const formattedTechnicians = response.data.map(tech => ({
          ...tech,
          username: tech.username || 'unknown',
          firstName: tech.firstName || '',
          lastName: tech.lastName || ''
        }));
        
        setLocalTechnicians(formattedTechnicians);
        console.log('Technicians set:', formattedTechnicians);
      } else {
        console.warn('No technicians found or invalid data format');
        setLocalTechnicians([]);
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to load technicians');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTechnician) {
      setError('Please select a technician');
      return;
    }

    try {
      console.log(`Assigning ticket ${ticketId} to technician ${selectedTechnician}`);
      
      // Call assignTicket from TicketContext
      const result = await assignTicket(ticketId, selectedTechnician);
      console.log('Assignment result:', result);
      
      // Find the selected technician's details
      const selectedTech = localTechnicians.find(tech => tech._id === selectedTechnician);
      console.log('Selected technician details:', selectedTech);
      
      if (onSuccess) {
        console.log('Calling onSuccess callback with result');
        onSuccess({
          ...result,
          assignedTo: selectedTech // Ensure we pass complete technician data
        });
      }
      handleClose();
    } catch (err) {
      console.error('Error assigning ticket:', err);
      console.error('Error details:', err.response?.data);
      setError(err.message || 'Failed to assign ticket');
    }
  };

  // Render technician name with fallbacks
  const renderTechnicianName = (tech) => {
    const username = tech.username || 'Unknown';
    const firstName = tech.firstName || '';
    const lastName = tech.lastName || '';
    
    if (firstName || lastName) {
      return `${username} (${firstName} ${lastName})`.trim();
    }
    return username;
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Assign Ticket</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          Select a technician to assign this ticket to:
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          <FormControl fullWidth error={!localTechnicians.length}>
            <InputLabel id="technician-select-label">Technician</InputLabel>
            <Select
              labelId="technician-select-label"
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              label="Technician"
              disabled={loading}
            >
              {localTechnicians.length === 0 ? (
                <MenuItem disabled value="">
                  No technicians available
                </MenuItem>
              ) : (
                localTechnicians.map((tech) => (
                  <MenuItem key={tech._id} value={tech._id}>
                    {renderTechnicianName(tech)}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={handleAssign} 
          color="primary" 
          variant="contained" 
          disabled={loading || !selectedTechnician}
        >
          {loading ? <CircularProgress size={24} /> : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignTicketDialog;
