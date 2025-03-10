import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { socket } from '../../utils/socket';

const Chat = ({ ticketId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usersTyping, setUsersTyping] = useState([]);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket || !ticketId) return;

    // Join ticket room
    socket.emit('join_ticket', ticketId);

    // Listen for new messages
    socket.on('message_received', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Listen for typing status
    socket.on('user_typing', ({ userId, typing }) => {
      setUsersTyping(prev => {
        if (typing) {
          return [...new Set([...prev, userId])];
        } else {
          return prev.filter(id => id !== userId);
        }
      });
    });

    // Listen for errors
    socket.on('error', (errorMessage) => {
      setError(errorMessage);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leave_ticket', ticketId);
      socket.off('message_received');
      socket.off('user_typing');
      socket.off('error');
    };
  }, [ticketId]);

  // Handle sending messages
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit('ticket_message', {
      ticketId,
      message: newMessage.trim()
    });

    setNewMessage('');
  };

  // Handle typing status
  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (value && !newMessage) {
      socket.emit('typing_start', ticketId);
    } else if (!value && newMessage) {
      socket.emit('typing_end', ticketId);
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2, height: '500px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
        <List>
          {messages.map((message, index) => (
            <ListItem
              key={index}
              sx={{
                justifyContent: message.sender.userId === user.userId ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 1,
                  maxWidth: '70%',
                  backgroundColor: message.sender.userId === user.userId ? '#e3f2fd' : '#f5f5f5',
                }}
              >
                <Typography variant="caption" display="block" color="textSecondary">
                  {message.sender.name} • {new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
                <Typography>{message.content}</Typography>
              </Paper>
            </ListItem>
          ))}
          {usersTyping.length > 0 && (
            <ListItem>
              <Typography variant="caption" color="textSecondary">
                {usersTyping.length === 1
                  ? 'Someone is typing...'
                  : 'Multiple people are typing...'}
              </Typography>
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Box>
      <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleTyping}
          size="small"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!newMessage.trim()}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default Chat; 