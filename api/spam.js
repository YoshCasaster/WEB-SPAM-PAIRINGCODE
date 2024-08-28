const { default: makeWASocket, fetchLatestBaileysVersion, useMultiFileAuthState, makeInMemoryStore, Browsers } = require('@whiskeysockets/baileys');
const NodeCache = require('node-cache');
const pino = require('pino');

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
const progressCache = new NodeCache();

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

export default async function handler(req, res) {
    if (req.method === 'POST') {
        if (req.url === '/api/spam') {
            const { phoneNumber } = req.body;
            if (!phoneNumber || !phoneNumber.match(/^62\d{7,}$/)) {
                return res.status(400).json({ message: 'Nomor HP tidak valid.' });
            }

            progressCache.set('status', `Mengirim ke ${phoneNumber}`);
            res.status(200).json({ message: `Mengirim ke ${phoneNumber}` });
        } else if (req.url === '/api/spam/stop') {
            progressCache.del('status');
            res.status(200).json({ message: 'Pengiriman dihentikan.' });
        } else {
            res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
        }
    } else {
        res.status(405).json({ message: 'Metode tidak diperbolehkan.' });
    }
}
