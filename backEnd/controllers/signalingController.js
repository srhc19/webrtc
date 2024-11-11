
const Connection = require('../models/connection');

const signalingController = (io) => {
    io.on('connection', (socket) => {
        console.log("User connected");

        const { userName, password } = socket.handshake.auth;

        if (password !== 'x') {
            socket.disconnect(true);
            return;
        }

        Connection.addSocketConnection(socket.id, userName);

        if (Connection.offers.length) {
            socket.emit('availableOffers', Connection.offers);
        }

        socket.on('newOffer', (newOffer) => {
            Connection.addOffer({
                offererUserName: userName,
                offer: newOffer,
                offerIceCandidates: [],
                answererUserName: null,
                answer: null,
                answererIceCandidates: []
            });
            socket.broadcast.emit('newOfferAwaiting', Connection.offers.slice(-1));
        });

        socket.on('newAnswer', (offerObj, ackFunction) => {
            const offerToUpdate = Connection.findOfferByUserName(offerObj.offererUserName);
            if (!offerToUpdate) return;

            ackFunction(offerToUpdate.offerIceCandidates);
            offerToUpdate.answer = offerObj.answer;
            offerToUpdate.answererUserName = userName;

            const socketToAnswer = Connection.findSocketByUserName(offerObj.offererUserName);
            if (socketToAnswer) {
                socket.to(socketToAnswer.socketId).emit('answerResponse', offerToUpdate);
            }
        });

        socket.on('sendIceCandidateToSignalingServer', (iceCandidateObj) => {
            const { didIOffer, iceUserName, iceCandidate } = iceCandidateObj;
            const offer = Connection.findOfferByUserName(iceUserName);

            if (didIOffer) {
                offer.offerIceCandidates.push(iceCandidate);
                if (offer.answererUserName) {
                    const socketToSendTo = Connection.findSocketByUserName(offer.answererUserName);
                    if (socketToSendTo) {
                        socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate);
                    }
                }
            } else {
                offer.answererIceCandidates.push(iceCandidate);
                const socketToSendTo = Connection.findSocketByUserName(offer.offererUserName);
                if (socketToSendTo) {
                    socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate);
                }
            }
        });
    });
};

module.exports = signalingController;
