import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

// Get admin dashboard stats
export const getStats = async (req, res) => {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalTickets, totalUsers, urgentTickets, resolvedToday] = await Promise.all([
      Ticket.countDocuments(),
      User.countDocuments({ role: 'client' }),
      Ticket.countDocuments({ priority: 'urgent' }),
      Ticket.countDocuments({ 
        status: 'resolved', 
        updatedAt: { $gte: today } 
      })
    ]);

    res.json({
      totalTickets,
      totalUsers,
      urgentTickets,
      resolvedToday
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ message: 'Error getting admin stats' });
  }
};

// Get all tickets for admin
export const getTickets = async (req, res) => {
  try {
    // First get all tickets with client and assignedTo populated
    const tickets = await Ticket.find()
      .populate('client', 'username email firstName lastName companyName department phoneNumber')
      .populate('assignedTo', 'username firstName lastName specialty')
      .sort({ createdAt: -1 })
      .limit(20);

    // Process each ticket to ensure client details are included
    const processedTickets = await Promise.all(tickets.map(async (ticket) => {
      const ticketObj = ticket.toObject();
      
      // If clientDetails are missing but we have a client, copy the details
      if ((!ticketObj.clientDetails || Object.keys(ticketObj.clientDetails).length === 0) && ticketObj.client) {
        ticketObj.clientDetails = {
          firstName: ticketObj.client.firstName || '',
          lastName: ticketObj.client.lastName || '',
          companyName: ticketObj.client.companyName || 'Beta Tech Client',
          username: ticketObj.client.username || '',
          department: ticketObj.client.department || '',
          phoneNumber: ticketObj.client.phoneNumber || ''
        };
        
        // Update the ticket in the database with the new clientDetails
        await Ticket.findByIdAndUpdate(ticket._id, { clientDetails: ticketObj.clientDetails });
      }
      
      // Ensure product information exists
      if (!ticketObj.product || !ticketObj.product.name) {
        ticketObj.product = {
          name: 'Beta Tech Product',
          type: 'Software',
          serialNumber: 'BT-' + Math.floor(10000 + Math.random() * 90000)
        };
        
        // Update the ticket in the database with the product info
        await Ticket.findByIdAndUpdate(ticket._id, { product: ticketObj.product });
      }
      
      // Ensure category exists
      if (!ticketObj.category) {
        ticketObj.category = 'Software';
        
        // Update the ticket in the database
        await Ticket.findByIdAndUpdate(ticket._id, { category: ticketObj.category });
      }
      
      return ticketObj;
    }));

    res.json(processedTickets);
  } catch (error) {
    console.error('Error getting tickets:', error);
    res.status(500).json({ message: 'Error getting tickets' });
  }
};

// Get all ticket history
export const getTicketHistory = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('client', 'username email firstName lastName companyName department phoneNumber')
      .populate('assignedTo', 'username firstName lastName specialty')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Error getting ticket history:', error);
    res.status(500).json({ message: 'Error getting ticket history' });
  }
};

// Get all technicians
export const getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' })
      .select('_id username email specialty');

    res.json(technicians);
  } catch (error) {
    console.error('Error getting technicians:', error);
    res.status(500).json({ message: 'Error getting technicians' });
  }
};

// Assign ticket to technician
export const assignTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({ message: 'Technician ID is required' });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { 
        assignedTo: technicianId,
        status: 'assigned',
        assignedAt: new Date()
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({ message: 'Error assigning ticket' });
  }
};

// Get all clients
export const getClients = async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' })
      .select('_id username email companyName department phoneNumber createdAt')
      .sort({ createdAt: -1 });

    res.json(clients);
  } catch (error) {
    console.error('Error getting clients:', error);
    res.status(500).json({ message: 'Error getting clients' });
  }
};

// Get a specific client
export const getClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await User.findById(clientId)
      .select('_id username email companyName department phoneNumber createdAt');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error getting client:', error);
    res.status(500).json({ message: 'Error getting client' });
  }
};

// Get tickets for a specific client
export const getClientTickets = async (req, res) => {
  try {
    const { clientId } = req.params;
    const tickets = await Ticket.find({ client: clientId })
      .populate('assignedTo', 'username specialty')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Error getting client tickets:', error);
    res.status(500).json({ message: 'Error getting client tickets' });
  }
};
