import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * StatsCard component displays a statistic with a title and value
 * 
 * @param {Object} props
 * @param {string} props.title - The title of the statistic
 * @param {number} props.value - The value of the statistic
 * @param {string} props.color - The background color of the card
 * @returns {JSX.Element}
 */
const StatsCard = ({ title, value, color }) => {
  return (
    <Paper 
      elevation={2}
      sx={{
        height: '100%',
        backgroundColor: color || '#ffffff',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 3
        }
      }}
    >
      <Box p={3} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom 
          color="textSecondary"
          sx={{ fontWeight: 'medium' }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h3" 
          component="p"
          sx={{ 
            fontWeight: 'bold',
            color: 'text.primary'
          }}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  color: PropTypes.string
};

export default StatsCard;