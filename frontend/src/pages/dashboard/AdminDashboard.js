import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Tabs,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Assignment as TicketIcon,
  People as PeopleIcon,
  Warning as UrgentIcon,
  CheckCircle as ResolvedIcon,
  History as HistoryIcon,
  SupervisorAccount as ClientsIcon,
  Dashboard as DashboardIcon,
  SupportAgent as TechnicianIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TicketList from '../../components/tickets/TicketList';
import { API_URL, ADMIN_ENDPOINTS, TICKET_ENDPOINTS, USER_ENDPOINTS } from '../../utils/apiConfig';
import { useTickets } from '../../contexts/TicketContext';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {React.cloneElement(icon, { sx: { color, mr: 1 } })}
        <Typography color="textSecondary" variant="h6">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4">{value}</Typography>
    </CardContent>
  </Card>
);

const ActionCard = ({ title, description, icon, color, onClick }) => (
  <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={onClick}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {React.cloneElement(icon, { sx: { color, mr: 1 } })}
        <Typography color="textSecondary" variant="h6">
          {title}
        </Typography>
      </Box>
      <Typography variant="body2">{description}</Typography>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    urgentTickets: 0,
    technicians: 0,
    clients: 0
  });
  const [tickets, setTickets] = useState([]);
  const [assignTechDialogOpen, setAssignTechDialogOpen] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const navigate = useNavigate();
  const { fetchTickets } = useTickets();

  // Function to get dashboard stats
  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching dashboard stats...');
      
      // First try the DASHBOARD endpoint
      try {
        const response = await axios.get(ADMIN_ENDPOINTS.DASHBOARD, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Dashboard stats response:', response.data);
        setStats(response.data);
        setStatsLoading(false);
        return;
      } catch (err) {
        console.warn('Could not fetch from DASHBOARD endpoint, trying fallback...');
      }
      
      // If that fails, manually calculate stats from tickets and users
      const [ticketsResponse, usersResponse, techniciansResponse] = await Promise.all([
        axios.get(TICKET_ENDPOINTS.GET_ALL, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(USER_ENDPOINTS.GET_TECHNICIANS, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const allTickets = ticketsResponse.data;
      const ticketsArray = Array.isArray(allTickets) ? allTickets : 
                          (allTickets.tickets ? allTickets.tickets : []);
                          
      const allUsers = usersResponse.data;
      const usersArray = Array.isArray(allUsers) ? allUsers : [];
      
      const allTechnicians = techniciansResponse.data;
      const techniciansArray = Array.isArray(allTechnicians) ? allTechnicians : [];
      
      // Calculate stats
      const calculatedStats = {
        totalTickets: ticketsArray.length,
        openTickets: ticketsArray.filter(t => t.status !== 'resolved').length,
        resolvedTickets: ticketsArray.filter(t => t.status === 'resolved').length,
        urgentTickets: ticketsArray.filter(t => t.priority === 'urgent').length,
        technicians: techniciansArray.length,
        clients: usersArray.filter(u => u.role === 'client').length
      };
      
      console.log('Calculated stats:', calculatedStats);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setStatsLoading(false);
    }
  };

  // Function to get all tickets
  const fetchAllTickets = async () => {
    try {
      setLoading(true);
      console.log('Fetching all tickets...');
      const ticketsData = await fetchTickets();
      console.log('Tickets fetched:', ticketsData?.length || 0);
      
      // Sort tickets by creation date (newest first)
      const sortedTickets = ticketsData.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setTickets(sortedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to get all technicians
  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching technicians...');
      const response = await axios.get(USER_ENDPOINTS.GET_TECHNICIANS, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Technicians response:', response.data);
      setTechnicians(response.data);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchDashboardStats();
    fetchAllTickets();
    fetchTechnicians();
    
    // Refresh data every 60 seconds
    const interval = setInterval(() => {
      fetchDashboardStats();
      fetchAllTickets();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle ticket assignment
  const handleTicketAssigned = () => {
    // Refresh the tickets list after assignment
    fetchAllTickets();
    fetchDashboardStats();
  };

  // Handle dialog open for bulk assignment
  const handleOpenAssignDialog = () => {
    setAssignTechDialogOpen(true);
  };

  // Handle dialog close
  const handleCloseAssignDialog = () => {
    setAssignTechDialogOpen(false);
    setSelectedTechnician('');
  };

  // Navigation functions
  const navigateToTickets = () => {
    navigate('/admin/tickets');
  };

  const navigateToUsers = () => {
    navigate('/admin/users');
  };

  // Filtering logic for different ticket tabs
  const getFilteredTickets = () => {
    switch (tabValue) {
      case 0: // All Tickets
        return tickets;
      case 1: // Open Tickets
        return tickets.filter(ticket => ticket.status !== 'resolved');
      case 2: // Assigned Tickets
        return tickets.filter(ticket => ticket.assignedTo);
      case 3: // Unassigned Tickets
        return tickets.filter(ticket => !ticket.assignedTo);
      case 4: // Urgent Tickets
        return tickets.filter(ticket => ticket.priority === 'urgent');
      case 5: // Resolved Tickets
        return tickets.filter(ticket => ticket.status === 'resolved');
      default:
        return tickets;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Total Tickets"
            value={statsLoading ? <CircularProgress size={24} /> : stats.totalTickets}
            icon={<TicketIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Open Tickets"
            value={statsLoading ? <CircularProgress size={24} /> : stats.openTickets}
            icon={<HistoryIcon />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Urgent Tickets"
            value={statsLoading ? <CircularProgress size={24} /> : stats.urgentTickets}
            icon={<UrgentIcon />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Resolved Tickets"
            value={statsLoading ? <CircularProgress size={24} /> : stats.resolvedTickets}
            icon={<ResolvedIcon />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Technicians"
            value={statsLoading ? <CircularProgress size={24} /> : stats.technicians}
            icon={<TechnicianIcon />}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Clients"
            value={statsLoading ? <CircularProgress size={24} /> : stats.clients}
            icon={<ClientsIcon />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* Action Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <ActionCard
            title="Manage Tickets"
            description="View and manage all support tickets"
            icon={<TicketIcon />}
            color="primary.main"
            onClick={navigateToTickets}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <ActionCard
            title="User Management"
            description="Manage technicians and clients"
            icon={<PeopleIcon />}
            color="secondary.main"
            onClick={navigateToUsers}
          />
        </Grid>
      </Grid>

      {/* Tickets Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Tickets" />
            <Tab label="Open" />
            <Tab label="Assigned" />
            <Tab label="Unassigned" />
            <Tab label="Urgent" />
            <Tab label="Resolved" />
          </Tabs>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleOpenAssignDialog}
            disabled={technicians.length === 0 || tickets.filter(t => !t.assignedTo).length === 0}
          >
            Assign All Unassigned
          </Button>
        </Box>
        <TicketList 
          tickets={getFilteredTickets()} 
          showAssignButton={true} 
          onTicketUpdated={handleTicketAssigned}
          loading={loading}
        />
      </Paper>

      {/* Assign Technician Dialog */}
      <Dialog open={assignTechDialogOpen} onClose={handleCloseAssignDialog}>
        <DialogTitle>Assign All Unassigned Tickets</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select a technician to assign all unassigned tickets to:
          </Typography>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="tech-select-label">Technician</InputLabel>
            <Select
              labelId="tech-select-label"
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              label="Technician"
            >
              {technicians.map((tech) => (
                <MenuItem key={tech._id} value={tech._id}>
                  {tech.username} ({tech.firstName} {tech.lastName})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>Cancel</Button>
          <Button 
            onClick={() => {
              // Logic to assign all unassigned tickets to the selected technician
              handleCloseAssignDialog();
            }} 
            color="primary"
            disabled={!selectedTechnician}
          >
            Assign All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
