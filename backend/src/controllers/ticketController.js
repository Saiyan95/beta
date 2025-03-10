import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { getIO } from '../socket/socketServer.js';

// Create a new ticket
export const createTicket = async (req, res) => {
  try {
    const {
      category,
      priority,
      description,
      numberOfUsers,
      product,
      clientInfo
    } = req.body;

    // Validate required fields
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }
    
    if (!priority) {
      return res.status(400).json({ message: 'Priority is required' });
    }

    // Validate description length if provided
    if (description && description.length > 1000) {
      return res.status(400).json({ message: 'Description is too long. Maximum 1000 characters allowed.' });
    }

    // Handle product data from the new structured format
    const productData = product || {};

    // Create ticket object with validated data
    const ticketData = {
      client: req.user.userId,
      category,
      product: {
        name: productData.name || category, // Use category as name if no product name provided
        type: productData.type || '',
        serialNumber: productData.serialNumber || '',
        warrantyStatus: {
          inWarranty: productData.warrantyStatus?.inWarranty || false,
          expiryDate: productData.warrantyStatus?.inWarranty && productData.warrantyStatus?.expiryDate ? 
                     new Date(productData.warrantyStatus.expiryDate) : null
        }
      },
      priority,
      description: description || '', // Use empty string if no description provided
      numberOfUsers: numberOfUsers ? parseInt(numberOfUsers, 10) : 1,
      // Store client info in ticket for easier access
      clientDetails: clientInfo ? {
        firstName: clientInfo.firstName,
        lastName: clientInfo.lastName,
        companyName: clientInfo.companyName,
        department: clientInfo.department,
        username: clientInfo.username,
        phoneNumber: clientInfo.phoneNumber
      } : undefined
    };

    // Manually generate ticket number
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await Ticket.countDocuments();
    const ticketNumber = `BT${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
    
    ticketData.ticketNumber = ticketNumber;

    // Create and save the ticket
    const ticket = new Ticket(ticketData);
    
    try {
      await ticket.validate(); // Validate before saving to catch validation errors
    } catch (validationError) {
      console.error('Ticket validation error:', validationError);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationError.errors 
      });
    }
    
    await ticket.save();

    // Add ticket to client's activeTickets
    await User.findByIdAndUpdate(req.user.userId, {
      $push: { activeTickets: ticket._id }
    });

    // Get the client info for notification
    const client = await User.findById(req.user.userId, 'name');

    // Emit socket event to all technicians
    const io = getIO();
    if (io) {
      io.to('technicians').emit('new_ticket', {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        category: ticket.category,
        productType: ticket.product.type,
        priority: ticket.priority,
        description: ticket.description,
        client: {
          _id: req.user.userId,
          name: client?.name || 'Client'
        }
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Ticket created successfully', 
      ticket 
    });
  } catch (error) {
    console.error('Error creating ticket - Full error:', error);
    console.error('Error stack trace:', error.stack);
    
    // Detailed error logging for specific error types
    if (error.name === 'ValidationError') {
      console.error('Mongoose validation error details:', error.errors);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message) 
      });
    }
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      console.error('MongoDB error code:', error.code);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Duplicate key error. A ticket with this information already exists.' });
      }
    }
    
    res.status(500).json({ 
      message: 'Error creating ticket', 
      error: error.message,
      type: error.name || 'Unknown error type'
    });
  }
};

// Get all tickets (filtered by role)
export const getTickets = async (req, res) => {
  try {
    let query = {};
    
    // Filter tickets based on user role
    switch (req.user.role) {
      case 'client':
        query.client = req.user.userId;
        break;
      case 'technician':
        // Technicians see all tickets
        break;
      // Admin can see all tickets
      default:
    }

    const tickets = await Ticket.find(query)
      .populate('client', 'firstName lastName username companyName department phoneNumber')
      .populate('assignedTo', 'firstName lastName username')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
};

// Get ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('client', 'firstName lastName username companyName department phoneNumber')
      .populate('assignedTo', 'firstName lastName username');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user has access to this ticket
    if (req.user.role === 'client' && ticket.client._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'technician' && 
        ticket.assignedTo && 
        ticket.assignedTo._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Error fetching ticket' });
  }
};

// Update ticket status
export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Only admin and assigned technical can update status
    if (req.user.role === 'technician' && 
        ticket.assignedTo && ticket.assignedTo.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    ticket.status = status;
    ticket.history.push({
      action: `Status updated to ${status}`,
      performedBy: req.user.userId
    });

    await ticket.save();

    // Get updated ticket with populated fields
    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('client', 'name company phone')
      .populate('assignedTo', 'name');

    // Emit socket event for ticket update
    const io = getIO();
    if (io) {
      io.to(`ticket_${ticket._id}`).emit('ticket_updated', updatedTicket);
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ message: 'Error updating ticket status' });
  }
};

// Assign ticket to technician
export const assignTicket = async (req, res) => {
  try {
    const { technicianId } = req.body;
    console.log(`Assigning ticket ID ${req.params.id} to technician ID ${technicianId}`);

    // Allow both admins and technicians to self-assign
    if (req.user.role !== 'admin' && (req.user.role !== 'technician' || req.user.userId !== technicianId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // If ticket is already assigned to someone else
    if (ticket.assignedTo && ticket.assignedTo.toString() !== technicianId) {
      return res.status(400).json({ message: 'Ticket is already assigned to another technician' });
    }

    // Update ticket with technician assignment
    ticket.assignedTo = technicianId;
    ticket.status = 'in_progress';
    ticket.history.push({
      action: 'Assigned to technician',
      performedBy: req.user.userId
    });

    await ticket.save();

    // Get technician info for response and notification
    const technician = await User.findById(technicianId, 'firstName lastName username');
    console.log('Technician assigned:', technician);

    // Get updated ticket with populated fields
    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('client', 'firstName lastName company phone username')
      .populate('assignedTo', 'firstName lastName username specialization');

    console.log('Updated ticket with assigned technician:', JSON.stringify({
      ticketId: updatedTicket._id,
      assignedTo: updatedTicket.assignedTo
    }, null, 2));

    // Emit socket event for ticket assignment
    const io = getIO();
    if (io) {
      // Emit to the ticket room
      io.to(`ticket_${ticket._id}`).emit('ticket_updated', updatedTicket);

      // Emit to the client
      io.to(`user_${ticket.client}`).emit('ticket_assigned', {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        technician: {
          _id: technicianId,
          name: technician ? `${technician.firstName} ${technician.lastName}` : 'Unknown',
          username: technician?.username || 'unknown'
        }
      });
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({ message: 'Error assigning ticket' });
  }
};

// Add message to ticket
export const addMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const ticketId = req.params.id;

    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user has access to this ticket
    if (req.user.role === 'client' && ticket.client.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'technician' && 
        ticket.assignedTo && 
        ticket.assignedTo.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create message
    const message = {
      sender: req.user.userId,
      content,
      timestamp: new Date()
    };

    // Add message to ticket
    ticket.messages.push(message);
    await ticket.save();

    // Get the sender info for the response
    const sender = await User.findById(req.user.userId, 'name role');

    // Prepare message with sender info
    const messageWithSender = {
      ...message.toObject(),
      sender: {
        _id: sender._id,
        name: sender.name,
        role: sender.role
      },
      ticketId
    };

    // Emit socket event for new message
    const io = getIO();
    if (io) {
      io.to(`ticket_${ticketId}`).emit('new_message', messageWithSender);
    }

    res.status(201).json(messageWithSender);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Error adding message' });
  }
};

// Get ticket messages
export const getTicketMessages = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('messages.sender', 'name role');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user has access to this ticket
    if (req.user.role === 'client' && ticket.client.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Format messages for response
    const messages = ticket.messages.map(msg => ({
      _id: msg._id,
      content: msg.content,
      timestamp: msg.timestamp,
      sender: msg.sender,
      ticketId: ticket._id
    }));

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

// Get ticket statistics
export const getTicketStats = async (req, res) => {
  try {
    // Only admin and technicians can access stats
    if (req.user.role !== 'admin' && req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Count tickets by status
    const statusCounts = await Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Count tickets by priority
    const priorityCounts = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Count tickets by category
    const categoryCounts = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Format the results
    const formatCounts = (counts) => {
      return counts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});
    };

    res.json({
      status: formatCounts(statusCounts),
      priority: formatCounts(priorityCounts),
      category: formatCounts(categoryCounts),
      total: await Ticket.countDocuments()
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({ message: 'Error fetching ticket statistics' });
  }
};

// Submit ticket review
export const submitReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Only the client who created the ticket can submit a review
    if (ticket.client.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the ticket creator can submit a review' });
    }

    // Can only review resolved tickets
    if (ticket.status !== 'resolved') {
      return res.status(400).json({ message: 'Can only review resolved tickets' });
    }

    // Can't submit multiple reviews
    if (ticket.review && ticket.review.submittedAt) {
      return res.status(400).json({ message: 'Review already submitted for this ticket' });
    }

    ticket.review = {
      rating,
      comment,
      submittedAt: new Date()
    };

    ticket.status = 'closed';
    ticket.history.push({
      action: `Ticket closed with ${rating}-star review`,
      performedBy: req.user.userId
    });

    await ticket.save();

    // Get updated ticket with populated fields
    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('client', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username');

    // Emit socket event for ticket update
    const io = getIO();
    if (io) {
      io.to(`ticket_${ticket._id}`).emit('ticket_updated', updatedTicket);
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Error submitting review' });
  }
};
