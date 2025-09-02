// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const http = require('http');
const { Server } = require("socket.io");
const path = require("path");
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3001;
const APP_NAME = process.env.APP_NAME || "MyApp";

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// serve index.html for chat
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// routes
app.get('/api/data', (req, res) => {
  res.json({ message: 'This data is open for everyone!' });
});

// joi schema
const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
  birth_year: Joi.number().integer().min(1900).max(new Date().getFullYear())
});

// post route
app.post('/api/users', (req, res) => {
  const { error, value } = userSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: 'Invalid data',
      details: error.details
    });
  }

  console.log('Validated data:', value);
  res.status(201).json({
    message: 'User created successfully!',
    data: value
  });
});

// socket.io chat
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat message', `[${socket.id} says]: ${msg}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// start server
server.listen(PORT, () => {
  console.log(`🚀 ${APP_NAME} running with WebSocket on http://localhost:${PORT}`);
});
