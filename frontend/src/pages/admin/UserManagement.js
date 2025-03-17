import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Engineering as EngineeringIcon,
  AdminPanelSettings as AdminIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../utils/apiConfig';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phoneNumber: '',
    password: '',
    role: 'technician',
    specialization: [],
    companyName: '',
    department: 'IT'
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching users from:', `${API_URL}/admin/users`);
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Users fetched successfully:', response.data);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenDialog = (mode, user = null) => {
    setDialogMode(mode);
    setSelectedUser(user);
    
    if (mode === 'edit' && user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        username: user.username || '',
        phoneNumber: user.phoneNumber || '',
        password: '', // Don't populate password for security reasons
        role: user.role || 'technician',
        specialization: user.specialization || [],
        companyName: user.companyName || '',
        department: user.department || 'IT'
      });
    } else {
      // Reset form for create mode
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        phoneNumber: '',
        password: '',
        role: 'technician',
        specialization: [],
        companyName: '',
        department: 'IT'
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    console.log('Closing dialog');
    setOpenDialog(false);
    clearForm();
  };

  const clearForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      phoneNumber: '',
      password: '',
      role: 'technician',
      specialization: [],
      companyName: '',
      department: 'IT'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        ...formData,
        role: formData.role === 'technical' ? 'technician' : formData.role,
        isTechnicalStaff: formData.role === 'technician',
        hasPrivileges: formData.role === 'technician',
        technicalPrivileges: formData.role === 'technician' ? {
          canHandleTickets: true,
          canUpdateTickets: true,
          canViewAllTickets: true,
          canAssignTickets: true,
          canCloseTickets: true,
          canAddComments: true,
          canViewReports: true
        } : undefined
      };

      await axios.post(
        `${API_URL}/admin/users`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      showSnackbar('User created successfully', 'success');
      fetchUsers();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving user:', err);
      console.error('Error response:', err.response?.data);
      showSnackbar(
        err.response?.data?.message || 'Failed to save user', 
        'error'
      );
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      console.log('Deleting user at:', `${API_URL}/admin/users/${userId}`);
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('User deleted successfully');
      showSnackbar('User deleted successfully', 'success');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      console.error('Error response:', error.response?.data);
      showSnackbar(
        error.response?.data?.message || 'Failed to delete user', 
        'error'
      );
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminIcon color="primary" />;
      case 'technician':
        return <EngineeringIcon color="success" />;
      case 'client':
        return <PersonIcon color="info" />;
      default:
        return <PersonIcon />;
    }
  };

  const specializations = [
    'Hardware', 'Software', 'Network', 'Cloud Services', 'Database', 
    'Security', 'Mobile Devices', 'Printers', 'Email', 'VoIP',
    'Cybersecurity', 'Firewall'
  ];

  const departments = [
    'IT', 'Finance', 'Human Resources', 'Marketing', 'Sales', 
    'Operations', 'Research & Development', 'Customer Service', 'Legal', 'Other'
  ];

  // Separate function to handle specialization change
  const handleSpecializationChange = (event) => {
    const { value } = event.target;
    console.log('Specialization selected:', value);
    setFormData(prev => ({
      ...prev,
      specialization: value
    }));
  };

  const handleOpenPasswordDialog = (user) => {
    setSelectedUser(user);
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    });
    setOpenPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar('Passwords do not match', 'error');
      return;
    }

    try {
      const userData = {
        password: passwordData.newPassword,
        // Ensure technician privileges are maintained
        isTechnicalStaff: selectedUser.role === 'technician',
        hasPrivileges: selectedUser.role === 'technician'
      };

      await axios.patch(
        `${API_URL}/admin/users/${selectedUser._id}`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      showSnackbar('Password updated successfully', 'success');
      handleClosePasswordDialog();
    } catch (error) {
      console.error('Error updating password:', error);
      showSnackbar(
        error.response?.data?.message || 'Failed to update password',
        'error'
      );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            User Management
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
          >
            Create User
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No users found</TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getRoleIcon(user.role)}
                        <Typography sx={{ ml: 1, textTransform: 'capitalize' }}>
                          {user.role}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{`${user.firstName || ''} ${user.lastName || ''}`}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNumber}</TableCell>
                    <TableCell>
                      {user.role === 'technician' && user.specialization && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {user.specialization.map((spec) => (
                            <Chip key={spec} label={spec} size="small" color="success" variant="outlined" />
                          ))}
                        </Box>
                      )}
                      {user.role === 'client' && (
                        <Typography variant="body2" color="text.secondary">
                          {user.companyName} - {user.department}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog('edit', user)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleOpenPasswordDialog(user)} color="primary">
                        <LockIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteUser(user._id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* User Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New User' : 'Edit User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required={dialogMode === 'create'}
                helperText={dialogMode === 'edit' ? 'Leave blank to keep current password' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="technician">Technician</MenuItem>
                  <MenuItem value="client">Client</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Conditional fields based on role */}
            {formData.role === 'technician' && (
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="specialization-label">Specialization</InputLabel>
                  <Select
                    labelId="specialization-label"
                    name="specialization"
                    multiple
                    value={formData.specialization || []}
                    onChange={handleSpecializationChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected || []).map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                    MenuProps={{
                      disableScrollLock: true,
                      disablePortal: false,
                      transitionDuration: 0,
                      PaperProps: {
                        style: {
                          maxHeight: 224
                        }
                      }
                    }}
                  >
                    {specializations.map((spec) => (
                      <MenuItem key={spec} value={spec}>
                        {spec}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {formData.role === 'client' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="department-label">Department</InputLabel>
                    <Select
                      labelId="department-label"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      label="Department"
                      MenuProps={{
                        disableScrollLock: true,
                        PaperProps: {
                          style: {
                            maxHeight: 224
                          }
                        }
                      }}
                    >
                      {departments.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {dialogMode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog}>
        <DialogTitle>Change Password for {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Cancel</Button>
          <Button onClick={handlePasswordSubmit} variant="contained" color="primary">
            Update Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
