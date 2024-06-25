import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Tabs, Tab, Box, TextField, Button, Typography, Alert } from '@mui/material';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const LoginPage = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setMessage('');
  };

  const login = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        const errorText = await response.text();
        setMessage(errorText || 'Login failed');
      }
    } catch (error) {
      setMessage('Network error or server is down');
    }
  };

  const register = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/register`, 
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const responseBody = await response.text(); 
      if (response.ok) {
        setMessage('Registration successful, please log in.');
        setTabIndex(0);
      } else {
        setMessage(responseBody || 'Registration failed');
      }
    } catch (error) {
      setMessage('Network error or server is down');
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" sx={{ mt: 4, mb: 2, textAlign: 'center' }}>Chi Fou Mi Game</Typography>
      <Tabs value={tabIndex} onChange={handleTabChange} centered>
        <Tab label="Login" />
        <Tab label="Register" />
      </Tabs>
      <TabPanel value={tabIndex} index={0}>
        <TextField fullWidth label="Username" margin="normal" value={username} onChange={e => setUsername(e.target.value)} />
        <TextField fullWidth label="Password" type="password" margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={login}>Login</Button>
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <TextField fullWidth label="Username" margin="normal" value={username} onChange={e => setUsername(e.target.value)} />
        <TextField fullWidth label="Password" type="password" margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={register}>Register</Button>
      </TabPanel>
      {message && <Alert severity="error" sx={{ mt: 2 }}>{message}</Alert>}
    </Container>
  );
};

export default LoginPage;
