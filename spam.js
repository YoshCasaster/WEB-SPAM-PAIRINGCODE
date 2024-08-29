const express = require('express');
const pino = require('pino');
const fs = require('fs');
const chalk = require('chalk');
const axios = require('axios');
const _ = require('lodash');
const moment = require('moment-timezone');
const PhoneNumber = require('awesome-phonenumber');
const {
  default: spamConnect,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  Browsers
} = require('@whiskeysockets/baileys');
const NodeCache = require('node-cache');

const app = express();
const port = process.env.PORT || 3000;
const store = makeInMemoryStore({
  'logger': pino().child({
    'level': 'silent',
    'stream': 'store'
  })
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <h1>Spam Pairing Code Generator</h1>
    <form action="/pairing" method="POST">
      <label for="phoneNumber">Phone Number:</label>
      <input type="text" id="phoneNumber" name="phoneNumber" required>
      <button type="submit">Generate Pairing Code</button>
    </form>
  `);
});

app.post('/pairing', async (req, res) => {
  const phoneNumber = req.body.phoneNumber.replace(/[^0-9]/g, '');
  const PHONENUMBER_MCC = { "62": "Indonesia" }; // Define your phone number MCC here

  if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
    return res.send('Invalid phone number format');
  }

  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./targetsessi');
    const msgRetryCounterCache = new NodeCache();
    const spam = spamConnect({
      'logger': pino({
        'level': 'silent'
      }),
      'printQRInTerminal': false,
      'browser': Browsers.windows('Firefox'),
      'auth': {
        'creds': state.creds,
        'keys': makeCacheableSignalKeyStore(state.keys, pino({ 'level': 'fatal' }).child({ 'level': 'fatal' }))
      },
      'markOnlineOnConnect': true,
      'generateHighQualityLinkPreview': true,
      'getMessage': async key => {
        if (store) {
          const msg = await store.loadMessage(key.remoteJid, key.id);
          return msg.message || undefined;
        }
        return { 'conversation': 'SPAM PAIRING CODE' };
      },
      'msgRetryCounterCache': msgRetryCounterCache,
      'defaultQueryTimeoutMs': undefined
    });

    store.bind(spam.ev);

    let code = await spam.requestPairingCode(phoneNumber);
    code = code?.match(/.{1,4}/g)?.join('-') || code;

    res.send(`<h1>Pairing Code: ${code}</h1>`);
  } catch (error) {
    res.send('Error generating pairing code: ' + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
