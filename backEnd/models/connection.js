
class Connection {
    constructor() {
        this.offers = [];
        this.connectedSockets = [];
    }

    addOffer(offer) {
        this.offers.push(offer);
    }

    addSocketConnection(socketId, userName) {
        this.connectedSockets.push({ socketId, userName });
    }

    findSocketByUserName(userName) {
        return this.connectedSockets.find(socket => socket.userName === userName);
    }

    findOfferByUserName(userName) {
        return this.offers.find(offer => offer.offererUserName === userName || offer.answererUserName === userName);
    }

    updateOffer(offererUserName, updateData) {
        const offer = this.findOfferByUserName(offererUserName);
        if (offer) {
            Object.assign(offer, updateData);
        }
    }
}

module.exports = new Connection();
