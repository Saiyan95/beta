import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Divider,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  joinTicketRoom,
  leaveTicketRoom,
  sendTicketMessage,
  onSocketEvent,
  offSocketEvent
} from '../../services/socketService';
import { TICKET_ENDPOINTS } from '../../utils/apiConfig';

// Status color mapping
const statusColors = {
  new: 'info',
  in_progress: 'warning',
  on_hold: 'error',
  resolved: 'success',
  closed: 'default'
};

// Priority color mapping
const priorityColors = {
  low: 'success',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
  critical: 'error'
};

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });

  // Fetch ticket details
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await axios.get(TICKET_ENDPOINTS.GET_BY_ID(id), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setTicket(response.data);
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError('Failed to load ticket details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await axios.get(TICKET_ENDPOINTS.GET_MESSAGES(id), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setMessages(response.data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchTicket();
    fetchMessages();

    // Join ticket room for real-time updates
    joinTicketRoom(id);

    // Listen for new messages
    const handleNewMessage = (message) => {
      if (message.ticketId === id) {
        setMessages(prevMessages => [...prevMessages, message]);
      }
    };

    // Listen for ticket updates
    const handleTicketUpdate = (updatedTicket) => {
      if (updatedTicket._id === id) {
        setTicket(updatedTicket);
      }
    };

    onSocketEvent('new_message', handleNewMessage);
    onSocketEvent('ticket_updated', handleTicketUpdate);

    return () => {
      // Clean up socket listeners and leave room
      offSocketEvent('new_message', handleNewMessage);
      offSocketEvent('ticket_updated', handleTicketUpdate);
      leaveTicketRoom(id);
    };
  }, [id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setMessageSending(true);
    try {
      const response = await axios.post(
        TICKET_ENDPOINTS.ADD_MESSAGE(id),
        { content: newMessage },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Add the message locally if not received via socket
      const messageData = response.data;
      if (messageData) {
        setMessages(prevMessages => {
          // Check if message already exists to avoid duplicates
          if (!prevMessages.some(msg => msg._id === messageData._id)) {
            return [...prevMessages, messageData];
          }
          return prevMessages;
        });
      }
      
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setMessageSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await axios.patch(
        TICKET_ENDPOINTS.UPDATE_STATUS(id),
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update ticket locally if not updated via socket
      if (response.data) {
        setTicket(response.data);
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
      setError('Failed to update ticket status. Please try again.');
    }
  };

  const handleAssignTicket = async () => {
    try {
      const response = await axios.patch(
        TICKET_ENDPOINTS.ASSIGN(id),
        { technicianId: user.userId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update ticket locally if not updated via socket
      if (response.data) {
        setTicket(response.data);
      }
    } catch (err) {
      console.error('Error assigning ticket:', err);
      setError('Failed to assign ticket. Please try again.');
    }
  };

  const handleSubmitReview = async () => {
    try {
      const response = await axios.post(
        `${TICKET_ENDPOINTS.BASE}/${id}/review`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setTicket(response.data);
      setReviewDialog(false);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

  if (!ticket) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Alert severity="warning">Ticket not found</Alert>
          <Button
            variant="outlined"
            onClick={() => navigate('/tickets')}
            sx={{ mt: 2 }}
          >
            Back to Tickets
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        {/* Ticket Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Ticket #{ticket.ticketNumber}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip 
              label={ticket.status.replace('_', ' ').toUpperCase()} 
              color={statusColors[ticket.status] || 'default'}
            />
            <Chip 
              label={ticket.priority.toUpperCase()} 
              color={priorityColors[ticket.priority] || 'default'}
            />
            <Chip 
              label={ticket.category.toUpperCase()} 
              color={ticket.category?.toLowerCase() === 'hardware' ? 'primary' : 
                     ticket.category?.toLowerCase() === 'software' ? 'secondary' : 
                     ticket.category?.toLowerCase() === 'network' ? 'success' : 
                     ticket.category?.toLowerCase() === 'account' ? 'warning' : 'default'}
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Ticket Details */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Issue Details</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Description:</strong> {ticket.description || 'No description provided'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Category:</strong> {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Priority:</strong> {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </Typography>
                {ticket.numberOfUsers > 1 && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Users Affected:</strong> {ticket.numberOfUsers}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Product Information</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {ticket.product.name || 'Unknown Product'}
                </Typography>
                
                {ticket.product.type && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Product Type:</strong> {ticket.product.type}
                  </Typography>
                )}
                
                {ticket.product.serialNumber && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Serial Number:</strong> {ticket.product.serialNumber}
                  </Typography>
                )}
                
                {ticket.product.warrantyStatus && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Warranty Status:</strong> {ticket.product.warrantyStatus.inWarranty ? 'In Warranty' : 'Out of Warranty'}
                    </Typography>
                    {ticket.product.warrantyStatus.inWarranty && ticket.product.warrantyStatus.expiryDate && (
                      <Typography variant="body2">
                        <strong>Expires:</strong> {new Date(ticket.product.warrantyStatus.expiryDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Support Details</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Client:</strong> {ticket.client?.name || 'Unknown'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Last Updated:</strong> {new Date(ticket.updatedAt).toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Assigned To:</strong> {ticket.assignedTo?.name || 'Unassigned'}
                </Typography>

                {/* Actions for technicians */}
                {(user.role === 'technician' || user.role === 'admin') && (
                  <Box sx={{ mt: 2 }}>
                    {!ticket.assignedTo && (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleAssignTicket}
                        sx={{ mr: 1, mb: 1 }}
                      >
                        Assign to Me
                      </Button>
                    )}

                    {(ticket.assignedTo?._id === user.userId || user.role === 'admin') && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>Update Status:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {ticket.status !== 'in_progress' && (
                            <Button 
                              size="small" 
                              variant="outlined" 
                              onClick={() => handleStatusChange('in_progress')}
                            >
                              In Progress
                            </Button>
                          )}
                          {ticket.status !== 'on_hold' && (
                            <Button 
                              size="small" 
                              variant="outlined" 
                              onClick={() => handleStatusChange('on_hold')}
                            >
                              On Hold
                            </Button>
                          )}
                          {ticket.status !== 'resolved' && (
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="success"
                              onClick={() => handleStatusChange('resolved')}
                            >
                              Resolved
                            </Button>
                          )}
                          {ticket.status !== 'closed' && (
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              onClick={() => handleStatusChange('closed')}
                            >
                              Close
                            </Button>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Messages Section */}
        <Typography variant="h6" gutterBottom>Messages</Typography>
        
        {messages.length > 0 ? (
          <List sx={{ width: '100%', bgcolor: 'background.paper', mb: 3 }}>
            {messages.map((message, index) => (
              <ListItem 
                key={message._id || index} 
                alignItems="flex-start"
                sx={{
                  bgcolor: message.sender?._id === user.userId ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: message.sender?.role === 'technician' ? 'primary.main' : 'secondary.main' }}>
                    {message.sender?.name?.charAt(0) || '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1">
                      {message.sender?.name || 'Unknown'}
                      <Typography 
                        component="span" 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        {new Date(message.timestamp).toLocaleString()}
                      </Typography>
                    </Typography>
                  }
                  secondary={message.content}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>No messages yet</Alert>
        )}

        {/* Message Input */}
        <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            placeholder="Type your message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={messageSending}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!newMessage.trim() || messageSending}
            sx={{ alignSelf: 'flex-end' }}
          >
            {messageSending ? <CircularProgress size={24} /> : 'Send'}
          </Button>
        </Box>

        {/* Review Dialog */}
        <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)}>
          <DialogTitle>Submit Review</DialogTitle>
          <DialogContent>
            <Box sx={{ my: 2 }}>
              <Typography component="legend">Rating</Typography>
              <Rating
                value={reviewData.rating}
                onChange={(event, newValue) => {
                  setReviewData(prev => ({ ...prev, rating: newValue }));
                }}
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comments"
              value={reviewData.comment}
              onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReviewDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitReview} variant="contained" color="primary">
              Submit Review
            </Button>
          </DialogActions>
        </Dialog>

        {/* Show review button for clients when ticket is resolved */}
        {user.role === 'client' && 
         ticket.status === 'resolved' && 
         !ticket.review && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setReviewDialog(true)}
            >
              Submit Review
            </Button>
          </Box>
        )}

        {/* Show review if it exists */}
        {ticket.review && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Review</Typography>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={ticket.review.rating} readOnly />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {new Date(ticket.review.submittedAt).toLocaleDateString()}
                  </Typography>
                </Box>
                {ticket.review.comment && (
                  <Typography variant="body1">{ticket.review.comment}</Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default TicketDetails;
