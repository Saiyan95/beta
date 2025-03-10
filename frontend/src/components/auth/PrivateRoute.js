import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  
  // Show loading indicator while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // If no user is logged in, redirect to the login page
  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  // Check if the user's role is in the allowed roles list
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on role
    switch(user.role) {
      case 'admin':
        return <Navigate to="/admin" />;
      case 'technical':
        return <Navigate to="/technical" />;
      case 'client':
        return <Navigate to="/client" />;
      default:
        // Fallback to login if role is unknown
        return <Navigate to="/auth/login" />;
    }
  }

  // If the user's role is allowed, render the child routes
  return <Outlet />;
};

export default PrivateRoute;
