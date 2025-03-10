import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for ticket migration'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Function to update tickets with client information
async function updateTicketsWithClientInfo() {
  try {
    console.log('Starting ticket client information update...');
    
    // Get all tickets that don't have clientDetails
    const tickets = await Ticket.find({});
    console.log(`Found ${tickets.length} tickets total`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const ticket of tickets) {
      try {
        // Skip tickets that already have complete client details
        if (ticket.clientDetails && 
            ticket.clientDetails.firstName && 
            ticket.clientDetails.lastName && 
            ticket.clientDetails.companyName) {
          console.log(`Ticket ${ticket.ticketNumber} already has client details, skipping`);
          continue;
        }
        
        // Find the client associated with this ticket
        if (!ticket.client) {
          console.log(`Ticket ${ticket.ticketNumber} has no client reference, skipping`);
          continue;
        }
        
        const client = await User.findById(ticket.client);
        if (!client) {
          console.log(`Client not found for ticket ${ticket.ticketNumber}, skipping`);
          continue;
        }
        
        // Update the ticket with client information
        ticket.clientDetails = {
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          companyName: client.companyName || '',
          username: client.username || '',
          department: client.department || '',
          phoneNumber: client.phoneNumber || ''
        };
        
        await ticket.save();
        updatedCount++;
        console.log(`Updated ticket ${ticket.ticketNumber} with client info: ${client.firstName} ${client.lastName} (${client.companyName})`);
      } catch (ticketError) {
        console.error(`Error updating ticket ${ticket.ticketNumber}:`, ticketError);
        errorCount++;
      }
    }
    
    console.log('Ticket update complete.');
    console.log(`Updated ${updatedCount} tickets`);
    console.log(`Encountered errors on ${errorCount} tickets`);
    
  } catch (error) {
    console.error('Error in migration script:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the update function
updateTicketsWithClientInfo();
