const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// fuck my stupid chungus life :pensive:


io.on('connection', (socket) => {
  io.emit('chat message', "-> A new user joined the chatroom.", "Server");

  socket.on('chat message', (msg, username) => {
    io.emit('chat message', msg, username);
    console.log("[Recenter] New message: " + msg);
  });

  socket.on('disconnect', () => {
    io.emit('chat message', "<- A user has left the chatroom.", "Server");
    console.log('user disconnected');
  });
});

server.listen(3010, () => {
  console.log('[Recenter] listening on port: 3010');
});