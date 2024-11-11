// server.js
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const signalingController = require('./controllers/signalingController');
const signalingRoutes = require('./routes/signalingRoutes');

const app = express();
app.use(express.static(__dirname));


app.use('/signal', signalingRoutes);


const server = http.createServer(app);


const io = socketio(server, {
    cors: {
        origin: ["http://localhost:4200"],
        methods: ["GET", "POST"],
        credentials: true, 
    },
});

// Initialize signaling controller 
signalingController(io);

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
