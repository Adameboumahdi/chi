import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Typography, Paper, Box, CircularProgress, Select, MenuItem, Alert } from '@mui/material';
import { EventSourcePolyfill } from 'event-source-polyfill';

const MatchPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [matchDetails, setMatchDetails] = useState(null);
  const [eventSource, setEventSource] = useState(null);
  const [selectedMove, setSelectedMove] = useState('');
  const [selectedTurn, setSelectedTurn] = useState('');
  const [gameStatus, setGameStatus] = useState('Waiting for match updates...');
  const [error, setError] = useState('');
  const [player1Wins, setPlayer1Wins] = useState(0);
  const [player2Wins, setPlayer2Wins] = useState(0);

  useEffect(() => {
    fetchMatchDetails();
    setupEventSource();
    return () => eventSource && eventSource.close();
  }, [id]);

  const fetchMatchDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matches/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMatchDetails(data);
        setPlayer1Wins(data.player1Wins || 0);
        setPlayer2Wins(data.player2Wins || 0);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load match details.');
      }
    } catch (error) {
      setError('Network error or server is down.');
    }
    setLoading(false);
  };

  const setupEventSource = () => {
    if (eventSource) {
      eventSource.close();
    }

    const es = new EventSourcePolyfill(`${import.meta.env.VITE_API_URL}/matches/${id}/subscribe`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleEvent(data);
    };

    es.onerror = () => {
      setError('SSE connection error, will retry...');
      es.close();
      setTimeout(setupEventSource, 5000);
    };

    setEventSource(es);
  };

  const handleEvent = (data) => {
    console.log('Event Received:', data);
    switch (data.type) {
      case 'PLAYER1_JOIN':
      case 'PLAYER2_JOIN':
        setGameStatus(`${data.payload.user} has joined the match`);
        break;
      case 'NEW_TURN':
        setGameStatus(`Turn ${data.payload.turnId} has started`);
        setMatchDetails(prevDetails => ({
          ...prevDetails,
          currentTurnId: data.payload.turnId,
        }));
        break;
      case 'TURN_ENDED':
        setGameStatus(`Turn ended. Winner: ${data.payload.winner}`);
        fetchMatchDetails();
        break;
      case 'PLAYER1_MOVED':
      case 'PLAYER2_MOVED':
        setGameStatus(`Player moved in turn ${data.payload.turn}`);
        break;
      case 'MATCH_ENDED':
        setGameStatus(`Match ended. Winner: ${data.payload.winner}`);
        fetchMatchDetails();
        break;
      default:
        setGameStatus('Update received from game.');
    }
  };

  const playTurn = async (move, turn) => {
    if (!matchDetails || !matchDetails.currentTurnId) {
      setError("No current turn available.");
      return;
    }

    const currentUserId = localStorage.getItem('userId');
    const currentTurn = matchDetails.turns.find(turn => turn._id === matchDetails.currentTurnId);

    // Vérifiez si l'utilisateur a déjà joué ce tour
    if (currentTurn.moves && currentTurn.moves.some(move => move.playerId === currentUserId)) {
      setError("You have already played your move for this turn.");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matches/${id}/turns/${matchDetails.currentTurnId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ move, turn }),
      });

      if (response.status === 400) {
        const responseData = await response.json();
        setError(responseData.turn || responseData.match || responseData.user || "Failed to play turn.");
      } else if (response.status === 202) {
        setGameStatus('Move submitted, waiting for next event...');
        setError('');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error when trying to play turn.');
    }
  };

  return (
    <Paper elevation={3} sx={{ padding: 2, margin: 'auto', maxWidth: 600 }}>
      <Typography variant="h4" gutterBottom>
        Match ID: {id}
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography>{gameStatus}</Typography>
          <Typography>Player 1 Wins: {player1Wins}</Typography>
          <Typography>Player 2 Wins: {player2Wins}</Typography>
          <Select
            value={selectedMove}
            onChange={(e) => setSelectedMove(e.target.value)}
            sx={{ minWidth: 120, mt: 2 }}
          >
            <MenuItem value="rock">Rock</MenuItem>
            <MenuItem value="paper">Paper</MenuItem>
            <MenuItem value="scissors">Scissors</MenuItem>
          </Select>
          <Select
            value={selectedTurn}
            onChange={(e) => setSelectedTurn(e.target.value)}
            sx={{ minWidth: 120, mt: 2 }}
          >
            <MenuItem value={1}>Turn 1</MenuItem>
            <MenuItem value={2}>Turn 2</MenuItem>
            <MenuItem value={3}>Turn 3</MenuItem>
          </Select>
          <Button variant="contained" onClick={() => playTurn(selectedMove, selectedTurn)} sx={{ mt: 2 }}>
            Play Turn
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default MatchPage;