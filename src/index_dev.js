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
  getMessages(); // first call to get messages, so everything loads
  io.emit('chat message', "-> A new user joined the chatroom.", "Server"); // send connect message as the server (do not put this in the database, its meant to expire)
  socket.on('chat message', (msg, username) => {
    io.emit('chat message', msg, username); // emit chat message 
    // io.emit is also what we use to show the message to the client, we may have to refactor this again for the other variables (timestamp and db) 
    var timesent = new Date().toISOString().slice(0, 19).replace('T', ' '); // get current time for db
    var sendMessagetoDB = `INSERT INTO messages (username, content, timestamp, server) VALUES ('${username}', '${msg}', '${timesent}', 'chat.haydar.dev')`; // sql command for db
    con.query(sendMessagetoDB, function (err, result) {
      if (err) throw err;
      console.log("Message added in database.");
      getMessages(); // second call for messages, so that messages get updated whenever you send one
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

// Gets all messages from the database and returns it in an array.
function getMessages() {
  let messageList = [];
  var selectMessagesDB = 'SELECT * from messages;';
  con.query(selectMessagesDB, function (err, result) {
    if (err) throw err;
    console.log("[Recenter] Fetched messages.");

    for (let i = 0; i < result.length; i++) {
      io.emit('chat message', result[i].content, result[i].username);
      messageList.push({
          'id': result[i].id,
          'username': result[0].username,
          'content': result[0].content,
          'timestamp': result[0].timestamp,
          'server': result[0].server
      });
  }
 // console.log(messageList);
  return messageList;
  });  
}