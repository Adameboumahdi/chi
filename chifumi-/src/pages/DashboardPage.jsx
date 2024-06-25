import React, { useState, useEffect } from 'react';
import { Button, List, ListItem, ListItemText, Typography, CircularProgress, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/matches`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`, 
          },
        });
        if (response.ok) {
          const data = await response.json();
          setMatches(data);
          const availableMatch = data.find(match => !match.user2);
          if (availableMatch) {
            handleJoinMatch(availableMatch._id);
          }
        } else {
          setError('Failed to load matches.');
        }
      } catch (error) {
        setError('Network error or server is down.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleCreateMatch = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, 
        },
      });
      if (response.ok) {
        const newMatch = await response.json();
        setMatches(prevMatches => [...prevMatches, newMatch]);
        navigate(`/partie/${newMatch._id}`);
      } else {
        setError('Failed to create a new match.');
      }
    } catch (error) {
      setError('Network error or server is down.');
    }
  };

  const handleJoinMatch = async (matchId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matches/${matchId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const updatedMatch = await response.json();
        setMatches(matches.map(m => m._id === matchId ? updatedMatch : m));
        navigate(`/partie/${matchId}`);
      } else {
        setError('Failed to join the match.');
      }
    } catch (error) {
      setError('Network error or server is down.');
    }
  };

  const handleReJoinMatch = async (matchId) => {
    try {
        navigate(`/partie/${matchId}`);
    } catch (error) {
        setError('Failed to navigate to the match.');
    }
};


  return (
    <Paper elevation={3} sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard - Chi Fou Mi Game
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <div>
          <Button variant="contained" color="primary" onClick={handleCreateMatch} sx={{ mb: 2 }}>
            Create Match
          </Button>
          <List>
            {matches.map((match) => (
              <ListItem key={match._id} onClick={() => handleReJoinMatch(match._id)}>
                <ListItemText
                  primary={`Match ID: ${match._id}`}
                  secondary={match.user2 ? `Player 2: ${match.user2.username}` : 'Waiting for Player 2'}
                />
              </ListItem>
            ))}
          </List>
          {error && <Typography color="error">{error}</Typography>}
        </div>
      )}
    </Paper>
  );
};

export default DashboardPage;