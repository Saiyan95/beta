import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TicketList from '../../components/tickets/TicketList';

const ClientTickets = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const [clientRes, ticketsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/clients/${clientId}`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/clients/${clientId}/tickets`)
      ]);
      
      setClient(clientRes.data);
      setTickets(ticketsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching client data:', err);
      setError('Failed to load client information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/clients')}
          sx={{ mt: 2 }}
        >
          Back to Clients
        </Button>
      </Container>
    );
  }

  if (!client) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">Client not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/clients')}
          sx={{ mt: 2 }}
        >
          Back to Clients
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/clients')}
          variant="outlined"
        >
          Back to Clients
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Client Information Card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h5" fontWeight="bold">
                Client Profile
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {client.username}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmailIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">{client.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BusinessIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">{client.companyName}</Typography>
              </Box>
              {client.department && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Department: <Chip size="small" label={client.department} />
                  </Typography>
                </Box>
              )}
              {client.phoneNumber && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">{client.phoneNumber}</Typography>
                </Box>
              )}
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Account Information
              </Typography>
              <Typography variant="body2">
                Registered: {new Date(client.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body2">
                Total Tickets: {tickets.length}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Client Tickets */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
              Ticket History
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {tickets.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  This client hasn't submitted any tickets yet.
                </Typography>
              </Box>
            ) : (
              <TicketList tickets={tickets} showClientInfo={false} />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ClientTickets;
