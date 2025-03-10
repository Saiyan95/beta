import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Typography,
  Box,
  Avatar,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import AssignTicketDialog from './AssignTicketDialog';
import Chat from '../chat/Chat';

const getStatusColor = (status) => {
  switch (status) {
    case 'new':
      return 'info';
    case 'in_progress':
      return 'warning';
    case 'on_hold':
      return 'error';
    case 'resolved':
      return 'success';
    default:
      return 'default';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
};

const TicketList = ({ tickets, onAssign, showAssignButton = false, onTicketUpdated, loading: externalLoading }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedTicketForChat, setSelectedTicketForChat] = useState(null);
  
  // Use external loading state if provided
  const loading = externalLoading || localLoading;

  // Ensure we have a valid user role for navigation
  const userRole = user?.role || 'client';

  const handleViewTicket = (ticketId) => {
    // Navigate to the correct role-specific ticket details page
    navigate(`/${userRole}/tickets/${ticketId}`);
  };

  // Handle opening the assign dialog
  const handleAssignClick = (ticketId) => {
    console.log('Opening assign dialog for ticket:', ticketId);
    setSelectedTicketId(ticketId);
    setAssignDialogOpen(true);
  };

  // Handle successful ticket assignment
  const handleAssignSuccess = (updatedTicket) => {
    console.log('Ticket assigned successfully', updatedTicket);
    setLocalLoading(true);
    if (onTicketUpdated) {
      console.log('Calling onTicketUpdated callback');
      onTicketUpdated();
    }
    setTimeout(() => setLocalLoading(false), 1000); // Give time for the UI to update
  };

  // Handle opening the chat dialog
  const handleChatClick = (ticket) => {
    setSelectedTicketForChat(ticket);
    setChatDialogOpen(true);
  };

  // Safely handle the case where tickets is undefined or empty
  const validTickets = Array.isArray(tickets) ? tickets : [];
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!validTickets.length) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          No tickets found
        </Typography>
      </Box>
    );
  }

  // Remove any duplicate tickets based on _id
  const uniqueTickets = validTickets.filter((ticket, index, self) => 
    index === self.findIndex(t => t._id === ticket._id)
  );

  console.log('Rendering tickets:', uniqueTickets.length);
  console.log('Sample ticket (first in list):', uniqueTickets[0]);

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ticket #</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uniqueTickets.map((ticket) => {
              // Prepare client display info - use clientDetails if available, otherwise use client
              // For username fallback, split the username at @ for email usernames
              const username = ticket.client?.username || '';
              const usernameDisplay = username.includes('@') ? username.split('@')[0] : username;
              
              const clientName = 
                (ticket.clientDetails?.firstName && ticket.clientDetails?.lastName) ? 
                  `${ticket.clientDetails.firstName} ${ticket.clientDetails.lastName}` :
                (ticket.client?.firstName && ticket.client?.lastName) ? 
                  `${ticket.client.firstName} ${ticket.client.lastName}` :
                  usernameDisplay || 'Unknown Client';
                  
              const companyName = 
                ticket.clientDetails?.companyName || 
                ticket.client?.companyName || 
                ticket.client?.company || 
                'Unknown Company';
                
              const department = 
                ticket.clientDetails?.department || 
                ticket.client?.department || '';
                
              const phoneNumber = 
                ticket.clientDetails?.phoneNumber || 
                ticket.client?.phoneNumber || '';

              // Set product info - display complete product details properly
              const productName = ticket.product?.name || ticket.productName || 'Unknown Product';
              const productType = ticket.product?.type || '';
              
              // Format category and product information for better readability
              const formattedCategory = ticket.category ? ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1) : 'Other';
              
              // Handle assignedTo display - check all possible formats
              const assignedToUser = ticket.assignedTo || {};
              console.log('Assigned to:', assignedToUser);
              
              // Format for displaying technician name with username
              let technicianName = '';
              let technicianUsername = '';
              
              if (assignedToUser) {
                if (assignedToUser.firstName && assignedToUser.lastName) {
                  technicianName = `${assignedToUser.firstName} ${assignedToUser.lastName}`;
                  technicianUsername = assignedToUser.username || '';
                } else if (assignedToUser.name) {
                  technicianName = assignedToUser.name;
                  technicianUsername = assignedToUser.username || '';
                } else if (assignedToUser.username) {
                  technicianName = assignedToUser.username;
                  technicianUsername = assignedToUser.username;
                }
              }
                
              return (
              <TableRow key={ticket._id}>
                <TableCell>{ticket.ticketNumber || 'N/A'}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {companyName}
                  </Typography>
                  <Typography variant="body2">
                    {clientName}
                    {department && 
                      <span style={{ color: '#666', fontSize: '0.85em' }}>
                        ({department})
                      </span>
                    }
                  </Typography>
                  {phoneNumber && (
                    <Typography variant="caption" color="textSecondary">
                      {phoneNumber}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">{productName}</Typography>
                  {productType && (
                    <Typography variant="caption" color="textSecondary">
                      Type: {productType}
                    </Typography>
                  )}
                  {ticket.product?.serialNumber && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      S/N: {ticket.product.serialNumber}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={formattedCategory}
                    color={ticket.category?.toLowerCase() === 'hardware' ? 'primary' : 
                           ticket.category?.toLowerCase() === 'software' ? 'secondary' : 
                           ticket.category?.toLowerCase() === 'network' ? 'success' : 
                           ticket.category?.toLowerCase() === 'account' ? 'warning' : 'default'}
                  />
                  {ticket.product?.type && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {ticket.product.type}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={ticket.priority}
                    color={getPriorityColor(ticket.priority)}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={ticket.status.replace('_', ' ')}
                    color={getStatusColor(ticket.status)}
                  />
                </TableCell>
                <TableCell>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {technicianName ? (
                    <Box>
                      {technicianUsername ? (
                        <Typography variant="body2">{technicianUsername}</Typography>
                      ) : (
                        <Typography variant="body2">{technicianName}</Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography color="textSecondary">Unassigned</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewTicket(ticket._id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    {showAssignButton && !ticket.assignedTo && (
                      <Tooltip title="Assign Ticket">
                        <IconButton
                          size="small"
                          onClick={() => handleAssignClick(ticket._id)}
                        >
                          <AssignmentIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Chat">
                      <IconButton
                        size="small"
                        onClick={() => handleChatClick(ticket)}
                      >
                        <ChatIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Ticket Assignment Dialog */}
      <AssignTicketDialog 
        open={assignDialogOpen}
        handleClose={() => setAssignDialogOpen(false)}
        ticketId={selectedTicketId}
        onSuccess={handleAssignSuccess}
      />

      {/* Chat Dialog */}
      <Dialog
        open={chatDialogOpen}
        onClose={() => setChatDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chat - Ticket #{selectedTicketForChat?.ticketNumber}
        </DialogTitle>
        <DialogContent>
          {selectedTicketForChat && (
            <Chat ticketId={selectedTicketForChat._id} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TicketList;
