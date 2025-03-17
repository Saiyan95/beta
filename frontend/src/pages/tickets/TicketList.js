import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box
} from '@mui/material';
import axios from 'axios';

const TicketList = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userType = localStorage.getItem('userType');

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/tickets`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTickets(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTicket = async (ticketId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tickets/${ticketId}/assign`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      fetchTickets(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign ticket');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'in-progress':
        return 'warning';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Support Tickets
          </Typography>
          {userType === 'client' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/client/tickets/create')}
            >
              Create New Ticket
            </Button>
          )}
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket._id}>
                  <TableCell>{ticket._id.substring(0, 8)}</TableCell>
                  <TableCell>{ticket.type}</TableCell>
                  <TableCell>{ticket.product}</TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.priority}
                      color={ticket.priority === 'high' ? 'error' : ticket.priority === 'medium' ? 'warning' : 'info'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status}
                      color={getStatusColor(ticket.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{ticket.createdBy?.username}</TableCell>
                  <TableCell>{ticket.assignedTo?.username || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/${userType}/tickets/${ticket._id}`)}
                      sx={{ mr: 1 }}
                    >
                      View
                    </Button>
                    {userType === 'technician' && !ticket.assignedTo && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAssignTicket(ticket._id)}
                      >
                        Accept
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default TicketList;
