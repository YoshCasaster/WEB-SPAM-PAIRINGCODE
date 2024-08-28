const express = require('express');
const bodyParser = require('body-parser');
const pino = require('pino');
const NodeCache = require('node-cache');

const app = express();
const port = 3000;
const progressCache = new NodeCache();

// Middlewares
app.use(express.static('.'));
app.use(bodyParser.json());

// Start spam endpoint
app.post('/start', (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber || !phoneNumber.match(/^62\d{7,}$/)) {
        return res.status(400).json({ message: 'Nomor HP tidak valid.' });
    }

    // Dummy spam logic
    progressCache.set('status', `Mengirim ke ${phoneNumber}`);
    res.json({ message: `Mengirim ke ${phoneNumber}` });
});

// Stop spam endpoint
app.post('/stop', (req, res) => {
    progressCache.del('status');
    res.json({ message: 'Pengiriman dihentikan.' });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
