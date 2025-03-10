import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Divider,
  Avatar,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Assignment,
  People,
  Settings,
  ExitToApp,
  SupportAgent,
  Person
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import TicketNotification from '../notifications/TicketNotification';

const drawerWidth = 260;

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    // Return empty array if user is not defined yet
    if (!user) return [];
    
    const commonItems = [
      {
        text: 'Dashboard',
        icon: <Dashboard />,
        path: `/${user.role}`
      },
      {
        text: 'Tickets',
        icon: <Assignment />,
        path: `/${user.role}/tickets`
      }
    ];

    if (user.role === 'admin') {
      return [
        ...commonItems,
        {
          text: 'Users',
          icon: <People />,
          path: '/admin/users'
        },
        {
          text: 'Settings',
          icon: <Settings />,
          path: '/admin/settings'
        }
      ];
    }

    if (user.role === 'technical') {
      return [
        ...commonItems,
        {
          text: 'My Assignments',
          icon: <Assignment />,
          path: '/technical/assignments'
        }
      ];
    }

    return [
      ...commonItems,
      {
        text: 'New Ticket',
        icon: <Assignment />,
        path: '/client/tickets/create'
      }
    ];
  };

  // If user is not defined, redirect to login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Don't render the layout if user is not defined
  if (!user) {
    return null;
  }

  const drawer = (
    <div>
      <Box
        sx={{
          py: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white'
        }}
      >
        <Avatar
          sx={{
            width: 60,
            height: 60,
            bgcolor: alpha(theme.palette.secondary.main, 0.9),
            mb: 1,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          {user.role === 'technical' ? <SupportAgent fontSize="large" /> : <Person fontSize="large" />}
        </Avatar>
        <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
          Beta Tech Support
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1, py: 2 }}>
        {getMenuItems().map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 2,
              mb: 1,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              }
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.primary.main }}>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{ fontWeight: 'medium' }}
            />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List sx={{ px: 1, py: 1 }}>
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: theme.palette.error.main,
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.1),
            }
          }}
        >
          <ListItemIcon sx={{ color: theme.palette.error.main }}>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{ fontWeight: 'medium' }}
          />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {user.username || 'Welcome'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <TicketNotification />
          </Box>
          <Button 
            color="inherit" 
            onClick={handleLogout}
            startIcon={<ExitToApp />}
            sx={{ 
              bgcolor: alpha(theme.palette.common.white, 0.1),
              '&:hover': {
                bgcolor: alpha(theme.palette.common.white, 0.2),
              },
              borderRadius: 2,
              px: 2
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: '4px 0 10px rgba(0,0,0,0.05)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh'
        }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            bgcolor: 'white',
            mb: 3
          }}
        >
          <Outlet />
        </Paper>
      </Box>
    </Box>
  );
};

export default Layout;
