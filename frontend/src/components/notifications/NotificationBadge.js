import React from 'react';
import { Badge, IconButton, Tooltip } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationBadge = ({ onClick, size = 'medium' }) => {
  const { unreadCount } = useNotifications();

  return (
    <Tooltip title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'No new notifications'}>
      <IconButton
        size={size}
        color="inherit"
        onClick={onClick}
        aria-label="show notifications"
        aria-controls="notifications-menu"
        aria-haspopup="true"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default NotificationBadge;
