const express = require('express');
const bodyParser = require('body-parser');
const pino = require('pino');
const NodeCache = require('node-cache');
const { default: makeWASocket, fetchLatestBaileysVersion, useMultiFileAuthState, makeInMemoryStore, Browsers } = require('@whiskeysockets/baileys');

const app = express();
const port = 3000;
const progressCache = new NodeCache();
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

// Middlewares
app.use(express.static('.'));
app.use(bodyParser.json());

// WhatsApp client setup
async function initializeClient() {
    let { version, isLatest } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    
    const client = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: Browsers.chrome(),
        auth: {
            creds: state.creds,
            keys: state.keys
        },
        markOnlineOnConnect: true,
    });
    
    store.bind(client.ev);

    return client;
}

const client = initializeClient();

// Start spam endpoint
app.post('/start', async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber || !phoneNumber.match(/^62\d{7,}$/)) {
        return res.status(400).json({ message: 'Nomor HP tidak valid.' });
    }

    // Dummy spam logic
    progressCache.set('status', `Mengirim ke ${phoneNumber}`);
    // Use Baileys API for spam logic here
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
