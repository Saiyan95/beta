import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Tab,
  Tabs,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Assignment as TicketIcon,
  CheckCircle as ResolvedIcon,
  Pending as PendingIcon,
  Timer as InProgressIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TicketList from '../../components/tickets/TicketList';
import { API_URL, TECHNICAL_ENDPOINTS } from '../../utils/apiConfig';

const StatCard = ({ title, value, icon, color }) => (
  <Card>
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

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    assignedTickets: 0,
    resolvedTickets: 0,
    inProgressTickets: 0,
    pendingTickets: 0
  });
  const [tickets, setTickets] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updateDialog, setUpdateDialog] = useState({
    open: false,
    ticketId: null,
    status: '',
    notes: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const [statsRes, ticketsRes] = await Promise.all([
        axios.get(TECHNICAL_ENDPOINTS.GET_STATS, config),
        axios.get(TECHNICAL_ENDPOINTS.GET_TICKETS, config)
      ]);
      setStats(statsRes.data);
      setTickets(ticketsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        TECHNICAL_ENDPOINTS.UPDATE_STATUS(updateDialog.ticketId),
        {
          status: updateDialog.status,
          notes: updateDialog.notes
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      fetchDashboardData();
      setUpdateDialog({ open: false, ticketId: null, status: '', notes: '' });
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const filterTickets = () => {
    switch (selectedTab) {
      case 0: // All Assigned
        return tickets;
      case 1: // In Progress
        return tickets.filter(ticket => ticket.status === 'in_progress');
      case 2: // Pending
        return tickets.filter(ticket => ticket.status === 'new' || ticket.status === 'on_hold');
      case 3: // Resolved
        return tickets.filter(ticket => ticket.status === 'resolved');
      default:
        return tickets;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Welcome, {user.name}
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Assigned Tickets"
            value={stats.assignedTickets}
            icon={<TicketIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={stats.inProgressTickets}
            icon={<InProgressIcon />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pendingTickets}
            icon={<PendingIcon />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Resolved"
            value={stats.resolvedTickets}
            icon={<ResolvedIcon />}
            color="success.main"
          />
        </Grid>

        {/* Tickets Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                <Tab label="All Assigned" />
                <Tab label="In Progress" />
                <Tab label="Pending" />
                <Tab label="Resolved" />
              </Tabs>
            </Box>
            <TicketList tickets={filterTickets()} />
          </Paper>
        </Grid>
      </Grid>

      {/* Update Status Dialog */}
      <Dialog open={updateDialog.open} onClose={() => setUpdateDialog({ ...updateDialog, open: false })}>
        <DialogTitle>Update Ticket Status</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Status"
            value={updateDialog.status}
            onChange={(e) => setUpdateDialog({ ...updateDialog, status: e.target.value })}
            sx={{ mt: 2 }}
          >
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="resolved">Resolved</option>
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            value={updateDialog.notes}
            onChange={(e) => setUpdateDialog({ ...updateDialog, notes: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialog({ ...updateDialog, open: false })}>Cancel</Button>
          <Button
            onClick={handleUpdateStatus}
            variant="contained"
            disabled={!updateDialog.status}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TechnicianDashboard;
