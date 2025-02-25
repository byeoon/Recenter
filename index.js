require('dotenv').config()

const express = require('express')
const http = require('http')
const path = require('path')
var mysql = require('mysql')

const app = express()

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var con = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  io.emit('chat message', "-> A new user joined the chatroom.", "Server"); // send connect message as the server (do not put this in the database, its meant to expire)

  socket.on('chat message', (msg, username) => {
    io.emit('chat message', msg, username); // emit chat message 
    var timesent = new Date().toISOString().slice(0, 19).replace('T', ' '); // get current time for db
    var sendMessagetoDB = `INSERT INTO messages (username, content, timestamp, server) VALUES ('${username}', '${msg}', '${timesent}', 'chat.haydar.dev')`; // sql command for db
    con.query(sendMessagetoDB, function (err, result) {
      if (err) throw err;
      console.log("Message added in database.");
    });
    console.log("[Recenter] New message: " + msg);
  });

  socket.on('disconnect', () => {
    io.emit('chat message', "<- A user has left the chatroom.", "Server"); // send disconnect message as the server (do not put this in database, its meant to expire)
  });
});

server.listen(process.env.PORT, () => {
  console.log(`[Recenter] Now listening on port: ${process.env.PORT}`);
  // connect to database when we start listening!
  con.connect(function(err) {
    if (err) throw err;
    console.log("[Recenter] Connected to Recenter database. DB: " + process.env.DATABASE); 
  });
});