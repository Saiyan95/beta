import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Tab, 
  Tabs, 
  CircularProgress,
  Stack,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { useTickets } from '../../contexts/TicketContext';
import { useAuth } from '../../contexts/AuthContext';
import TicketList from '../../components/tickets/TicketList';
import axios from 'axios';
import { API_URL } from '../../utils/apiConfig';

const ClientDashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { tickets, fetchTickets } = useTickets();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTickets: 0,
    activeTickets: 0,
    resolvedTickets: 0,
    assignedTechnicians: []
  });
  const [selectedTab, setSelectedTab] = useState(0);

  // Function to calculate stats from tickets
  const calculateStats = (ticketList) => {
    const activeTickets = ticketList.filter(t => t.status !== 'Resolved');
    const resolvedTickets = ticketList.filter(t => t.status === 'Resolved');
    const assignedTechs = [...new Set(ticketList
      .map(t => t.assignedTo?.name)
      .filter(Boolean))];
    
    return {
      totalTickets: ticketList.length,
      activeTickets: activeTickets.length,
      resolvedTickets: resolvedTickets.length,
      assignedTechnicians: assignedTechs
    };
  };

  const refreshDashboard = async () => {
    setLoading(true);
    try {
      // First fetch tickets
      await fetchTickets();
      
      // Then fetch stats from API
      const statsResponse = await axios.get(`${API_URL}/tickets/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Update stats with API response or calculate from tickets
      if (statsResponse.data && Object.keys(statsResponse.data).length > 0) {
        setStats(statsResponse.data);
      } else {
        // Calculate stats from tickets array as fallback
        setStats(calculateStats(tickets));
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      // Even if API fails, calculate stats from local tickets
      setStats(calculateStats(tickets));
    } finally {
      setLoading(false);
    }
  };

  // Update stats whenever tickets change
  useEffect(() => {
    setStats(calculateStats(tickets));
  }, [tickets]);

  // Initial load and refresh handling
  useEffect(() => {
    if (location.state?.refresh) {
      window.history.replaceState({}, document.title);
    }
    refreshDashboard();
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const getFilteredTickets = () => {
    switch (selectedTab) {
      case 0: // All tickets
        return tickets;
      case 1: // Active tickets
        return tickets.filter(ticket => ticket.status !== 'Resolved');
      case 2: // Resolved tickets
        return tickets.filter(ticket => ticket.status === 'Resolved');
      default:
        return tickets;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.firstName}!
        </Typography>
        
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Tickets
                </Typography>
                <Typography variant="h3">
                  {stats.totalTickets}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Tickets
                </Typography>
                <Typography variant="h3" color="primary">
                  {stats.activeTickets}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Resolved Tickets
                </Typography>
                <Typography variant="h3" color="success.main">
                  {stats.resolvedTickets}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {stats.assignedTechnicians.length > 0 && (
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Assigned Technicians
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {stats.assignedTechnicians.map((tech, index) => (
                <Chip
                  key={index}
                  label={tech}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Paper>
        )}

        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange} 
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label={`All Tickets (${stats.totalTickets})`} />
            <Tab label={`Active (${stats.activeTickets})`} />
            <Tab label={`Resolved (${stats.resolvedTickets})`} />
          </Tabs>
        </Paper>

        <TicketList 
          tickets={getFilteredTickets()} 
          showCreateButton={true}
          onRefresh={refreshDashboard}
          emptyMessage="No tickets found. Create a new support ticket to get help."
        />
      </Box>
    </Container>
  );
};

export default ClientDashboard;
