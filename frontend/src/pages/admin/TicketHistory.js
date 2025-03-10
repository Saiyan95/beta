import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import TicketList from '../../components/tickets/TicketList';

const TicketHistory = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/tickets/history`);
      setTickets(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching ticket history:', err);
      setError('Failed to load ticket history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Filter by tab (assigned status)
    if (tabValue === 1) { // Assigned
      filtered = filtered.filter(ticket => ticket.assignedTo);
    } else if (tabValue === 2) { // Unassigned
      filtered = filtered.filter(ticket => !ticket.assignedTo);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => {
        return (
          ticket.title?.toLowerCase().includes(term) ||
          ticket.description?.toLowerCase().includes(term) ||
          ticket.client?.username?.toLowerCase().includes(term) ||
          ticket.client?.email?.toLowerCase().includes(term) ||
          ticket.client?.companyName?.toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
          Ticket History
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View and manage all support tickets in the system.
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="All Tickets" />
                  <Tab label="Assigned" />
                  <Tab label="Unassigned" />
                </Tabs>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={handleStatusFilterChange}
                    >
                      <MenuItem value="all">All Statuses</MenuItem>
                      <MenuItem value="open">Open</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="resolved">Resolved</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                  />
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              {filterTickets().length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No tickets found matching your filters.
                  </Typography>
                </Box>
              ) : (
                <TicketList 
                  tickets={filterTickets()} 
                  showClientInfo={true}
                  showAssignedTo={true}
                />
              )}
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default TicketHistory;
