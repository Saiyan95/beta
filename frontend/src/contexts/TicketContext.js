import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { TICKET_ENDPOINTS, USER_ENDPOINTS, API_URL } from '../utils/apiConfig';

const TicketContext = createContext();

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
};

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [technicianLoading, setTechnicianLoading] = useState(false);

  // Fetch all technicians - Define this first since it's used in useEffect
  const fetchTechnicians = useCallback(async () => {
    setTechnicianLoading(true);
    try {
      console.log('Fetching technicians from:', USER_ENDPOINTS.GET_TECHNICIANS);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found for technician fetch');
        setTechnicianLoading(false);
        return [];
      }

      const response = await axios.get(USER_ENDPOINTS.GET_TECHNICIANS, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Technicians API response status:', response.status);
      console.log('Technicians fetched:', response.data);
      
      // Ensure we're dealing with an array of technicians
      const techData = Array.isArray(response.data) ? response.data : [];
      setTechnicians(techData);
      return techData;
    } catch (err) {
      console.error('Error fetching technicians:', err);
      console.error('Error response:', err.response?.data);
      return [];
    } finally {
      setTechnicianLoading(false);
    }
  }, []);

  // Fetch all tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching tickets from:', TICKET_ENDPOINTS.GET_ALL);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found for ticket fetch');
        setError('Authentication required');
        setLoading(false);
        return [];
      }

      const response = await axios.get(TICKET_ENDPOINTS.GET_ALL, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Log the raw response for debugging
      console.log('Raw tickets response:', response.data);
      
      // Ensure we're dealing with an array of tickets
      let ticketsData;
      if (Array.isArray(response.data)) {
        ticketsData = response.data;
      } else if (response.data.tickets && Array.isArray(response.data.tickets)) {
        ticketsData = response.data.tickets;
      } else if (typeof response.data === 'object') {
        // If it's an object, try to extract tickets from any property that is an array
        const possibleTicketsArray = Object.values(response.data).find(val => Array.isArray(val));
        ticketsData = possibleTicketsArray || [];
      } else {
        ticketsData = [];
      }
      
      console.log('Processed tickets data:', ticketsData);
      console.log('Number of tickets found:', ticketsData.length);
      
      setTickets(ticketsData);
      return ticketsData;
    } catch (err) {
      console.error('Error fetching tickets:', err);
      console.error('Error response:', err.response?.data);
      setError(err.message || 'Failed to fetch tickets');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    console.log('TicketContext mounted, fetching initial data...');
    const initializeData = async () => {
      await Promise.all([fetchTickets(), fetchTechnicians()]);
    };
    initializeData();
  }, [fetchTickets, fetchTechnicians]);

  // Add a new ticket to the local state
  const addTicket = useCallback((newTicket) => {
    console.log('Adding new ticket to context:', newTicket);
    setTickets(prevTickets => {
      // Ensure we don't add duplicate tickets
      const ticketExists = prevTickets.some(t => t._id === newTicket._id);
      if (ticketExists) {
        console.log('Ticket already exists in state, updating...');
        return prevTickets.map(t => t._id === newTicket._id ? newTicket : t);
      }
      console.log('Adding new ticket to state...');
      return [newTicket, ...prevTickets];
    });
  }, []);

  // Create a new ticket
  const createTicket = useCallback(async (ticketData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        TICKET_ENDPOINTS.CREATE,
        ticketData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.ticket) {
        addTicket(response.data.ticket);
      }
      
      return response.data;
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err.message || 'Failed to create ticket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addTicket]);

  // Find user by username and get their ID
  const findUserByUsername = useCallback(async (username) => {
    try {
      const response = await axios.get(`${API_URL}/users/find?username=${username}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (err) {
      console.error('Error finding user:', err);
      throw err;
    }
  }, []);

  // Assign ticket to a technician
  const assignTicket = useCallback(async (ticketId, technicianId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.patch(
        TICKET_ENDPOINTS.ASSIGN(ticketId),
        { technicianId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Find technician details
      const technicianDetails = technicians.find(tech => tech._id === technicianId) || {
        _id: technicianId,
        username: 'Unknown'
      };

      // Update the ticket in our local state
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket._id === ticketId ? {
            ...ticket, 
            assignedTo: response.data.assignedTo || technicianDetails,
            status: 'in_progress'
          } : ticket
        )
      );

      return response.data;
    } catch (err) {
      console.error(`Error assigning ticket ${ticketId}:`, err);
      setError(err.message || `Failed to assign ticket ${ticketId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [technicians]);

  // Assign all unassigned tickets to a specified technician
  const assignAllUnassignedTickets = useCallback(async (username) => {
    setLoading(true);
    setError(null);
    try {
      const user = await findUserByUsername(username);
      if (!user || !user._id) {
        throw new Error(`User ${username} not found`);
      }
      
      const unassignedTickets = tickets.filter(ticket => !ticket.assignedTo);
      if (unassignedTickets.length === 0) {
        return { message: 'No unassigned tickets found', assignedCount: 0 };
      }
      
      await Promise.all(unassignedTickets.map(ticket => 
        assignTicket(ticket._id, user._id)
      ));
      
      await fetchTickets();
      
      return { 
        message: `Successfully assigned ${unassignedTickets.length} tickets to ${username}`,
        assignedCount: unassignedTickets.length 
      };
    } catch (err) {
      console.error('Error assigning all unassigned tickets:', err);
      setError(err.message || 'Failed to assign tickets');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tickets, findUserByUsername, assignTicket, fetchTickets]);

  const value = {
    tickets,
    loading,
    error,
    fetchTickets,
    addTicket,
    createTicket,
    assignTicket,
    assignAllUnassignedTickets,
    technicians,
    technicianLoading,
    fetchTechnicians
  };

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};
