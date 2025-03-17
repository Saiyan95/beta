import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from '../contexts/NotificationContext';
import { TicketProvider } from '../contexts/TicketContext';

// Auth Components
import Login from '../pages/auth/Login';
import StaffLogin from '../pages/auth/StaffLogin';
import Register from '../pages/auth/Register';
import LoginBypass from '../pages/auth/LoginBypass';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Layout Components
import Layout from '../components/layout/Layout';

// Protected Route Component
import PrivateRoute from '../components/auth/PrivateRoute';

// Dashboard Components
import ClientDashboard from '../pages/dashboard/ClientDashboard';
import TechnicianDashboard from '../pages/dashboard/TechnicianDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard';

// Ticket Components
import CreateTicket from '../pages/tickets/CreateTicket';
import TicketList from '../components/tickets/TicketList';
import TicketDetails from '../pages/tickets/TicketDetails';

// Admin Components
import UserManagement from '../pages/admin/UserManagement';

const AppRoutes = () => {
  return (
    <NotificationProvider>
      <TicketProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/staff-login" element={<StaffLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login-bypass" element={<LoginBypass />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
            
          {/* Protected Client Routes */}
          <Route element={<PrivateRoute allowedRoles={['client']} />}>
            <Route element={<Layout />}>
              <Route path="/client" element={<ClientDashboard />} />
              <Route path="/client/tickets/create" element={<CreateTicket />} />
              <Route path="/client/tickets" element={<TicketList />} />
              <Route path="/client/tickets/:id" element={<TicketDetails />} />
            </Route>
          </Route>

          {/* Protected Technician Routes */}
          <Route element={<PrivateRoute allowedRoles={['technician']} />}>
            <Route element={<Layout />}>
              <Route path="/technician" element={<TechnicianDashboard />} />
              <Route path="/technician/tickets" element={<TicketList />} />
              <Route path="/technician/tickets/:id" element={<TicketDetails />} />
            </Route>
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route element={<Layout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/tickets" element={<TicketList />} />
              <Route path="/admin/tickets/:id" element={<TicketDetails />} />
            </Route>
          </Route>
            
          {/* Fallback routes */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </TicketProvider>
    </NotificationProvider>
  );
};

export default AppRoutes; 