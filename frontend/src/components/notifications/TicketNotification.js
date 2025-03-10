import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  Popover,
  Typography,
  Tooltip,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckIcon from '@mui/icons-material/Check';
import NotificationBadge from './NotificationBadge';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

// Format timestamp to relative time
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
};

const TicketNotification = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification 
  } = useNotifications();
  const { user } = useAuth();

  // Handle click on notification icon
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_ticket':
        return 'primary.main';
      case 'ticket_update':
        return 'warning.main';
      case 'new_message':
        return 'success.main';
      default:
        return 'grey.500';
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Navigate to the appropriate page based on notification type
    if (notification.ticketId) {
      navigate(`/tickets/${notification.ticketId}`);
    }
    
    handleClose();
  };

  // Handle mark as read
  const handleMarkAsRead = (notification, e) => {
    e.stopPropagation();
    markAsRead(notification.id);
  };

  // Handle remove notification
  const handleRemove = (notification, e) => {
    e.stopPropagation();
    removeNotification(notification.id);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notifications-popover' : undefined;

  return (
    <React.Fragment>
      <NotificationBadge onClick={handleClick} />
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500,
            overflow: 'auto',
            mt: 1,
            '&::-webkit-scrollbar': {
              width: '0.4em'
            },
            '&::-webkit-scrollbar-track': {
              boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
              webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,.1)',
              borderRadius: 4
            }
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            <Tooltip title="Mark all as read">
              <IconButton size="small" onClick={markAllAsRead} disabled={notifications.length === 0}>
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{
                    bgcolor: notification.read ? 'background.paper' : 'action.hover',
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: 'action.selected'
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getNotificationColor(notification.type) }}>
                      <NotificationsIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" component="span">
                          {notification.type === 'new_ticket' && 'New Ticket'}
                          {notification.type === 'ticket_update' && 'Ticket Updated'}
                          {notification.type === 'new_message' && 'New Message'}
                        </Typography>
                        <Chip 
                          label={formatTimestamp(notification.timestamp)}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.625rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {notification.message}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                    {!notification.read && (
                      <IconButton size="small" onClick={(e) => handleMarkAsRead(notification, e)} title="Mark as read">
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={(e) => handleRemove(notification, e)} title="Remove notification">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Popover>
    </React.Fragment>
  );
};

export default TicketNotification;
