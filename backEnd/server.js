const fs = require('fs');
const http = require('http'); // Changed from https to http
const express = require('express');
const app = express();
const socketio = require('socket.io');
app.use(express.static(__dirname));

// Removed the key and cert since they are specific to HTTPS
// const key = fs.readFileSync('cert.key');
// const cert = fs.readFileSync('cert.crt');

// Create an HTTP server instead of an HTTPS server
const expressServer = http.createServer(app);

// Create our socket.io server... it will listen to our express port
const io = socketio(expressServer, {
    cors: {
        origin: ["http://localhost:4200"],
        methods: ["GET", "POST"],
        credentials: true, 
    },
});

// Make sure to listen on HTTP port 3000
expressServer.listen(3000, () => {
    console.log("Running on port 3000");
});


const offers = [
    // offererUserName
    // offer
    // offerIceCandidates
    // answererUserName
    // answer
    // answererIceCandidates
];
const connectedSockets = [
    // username, socketId
];

io.on('connection', (socket) => {
    console.log("Someone has connected");
    const userName = socket.handshake.auth.userName;
    const password = socket.handshake.auth.password;
    console.log("Someone has connected",userName,password);
    if (password !== "x") {
        socket.disconnect(true);
        return;
    }

    connectedSockets.push({
        socketId: socket.id,
        userName
    });

    // A new client has joined. If there are any offers available,
    // emit them out
  
    if (offers.length) {
        console.log(offers,"available offers")
        socket.emit('availableOffers', offers);
    }

    socket.on('newOffer', (newOffer) => {
      
        offers.push({
            offererUserName: userName,
            offer: newOffer,
            offerIceCandidates: [],
            answererUserName: null,
            answer: null,
            answererIceCandidates: []
        });
console.log(offers)
        // Send out to all connected sockets EXCEPT the caller
        socket.broadcast.emit('newOfferAwaiting', offers.slice(-1));
    });

    socket.on('newAnswer', (offerObj, ackFunction) => {
        const socketToAnswer = connectedSockets.find(s => s.userName === offerObj.offererUserName);
        if (!socketToAnswer) {
            console.log("No matching socket");
            return;
        }

        const socketIdToAnswer = socketToAnswer.socketId;
        const offerToUpdate = offers.find(o => o.offererUserName === offerObj.offererUserName);

        if (!offerToUpdate) {
            console.log("No OfferToUpdate");
            return;
        }

        // Send back to the answerer all the iceCandidates we have already collected
        ackFunction(offerToUpdate.offerIceCandidates);
        offerToUpdate.answer = offerObj.answer;
        offerToUpdate.answererUserName = userName;

        // Emit the answer to the offerer
        socket.to(socketIdToAnswer).emit('answerResponse', offerToUpdate);
    });

    socket.on('sendIceCandidateToSignalingServer', (iceCandidateObj) => {
        const { didIOffer, iceUserName, iceCandidate } = iceCandidateObj;

        if (didIOffer) {
            // Ice candidate is from the offerer. Send to the answerer
            const offerInOffers = offers.find(o => o.offererUserName === iceUserName);
            if (offerInOffers) {
                offerInOffers.offerIceCandidates.push(iceCandidate);

                if (offerInOffers.answererUserName) {
                    const socketToSendTo = connectedSockets.find(s => s.userName === offerInOffers.answererUserName);
                    if (socketToSendTo) {
                        socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate);
                    }
                }
            }
        } else {
            // Ice candidate is from the answerer. Send to the offerer
            const offerInOffers = offers.find(o => o.answererUserName === iceUserName);
            const socketToSendTo = connectedSockets.find(s => s.userName === offerInOffers.offererUserName);
            if (socketToSendTo) {
                socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate);
            }
        }
    });
});
