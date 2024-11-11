
const express = require('express');
const router = express.Router();


router.get('/start-call', (req, res) => {
    res.send('WebRTC signaling server is ready.');
});

module.exports = router;
