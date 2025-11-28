// 🎉 Birthday Wish Script for WhatsApp
// Requires: Node.js, @whiskeysockets/baileys, axios, fs

import { makeWASocket, useSingleFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import Pino from 'pino';
import readline from 'readline';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// 1️⃣ Authentication & QR login
const { state, saveCreds } = useSingleFileAuthState('./auth_info.json');
const sock = makeWASocket({
    logger: Pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state
});

// Save credentials automatically
sock.ev.on('creds.update', saveCreds);

// 2️⃣ Readline for input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, ans => resolve(ans)));
}

// 3️⃣ Main Function
async function main() {
    try {
        const number = await askQuestion("Enter recipient's WhatsApp number (with country code, e.g., +1234567890): ");
        const message = await askQuestion("Enter your birthday message: ");
        const imageUrl = await askQuestion("Enter image URL to send: ");

        // Download image
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');

        // Send image with caption
        await sock.sendMessage(number + '@s.whatsapp.net', {
            image: imageBuffer,
            caption: message
        });

        console.log('🎉 Birthday wish sent successfully!');
        rl.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error sending message:', error);
        rl.close();
        process.exit(1);
    }
}

// 4️⃣ Handle disconnects
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if(connection === 'close') {
        if(lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
            main();
        } else {
            console.log('Logged out. Please delete auth_info.json and try again.');
        }
    } else if(connection === 'open') {
        console.log('✅ WhatsApp connection established.');
    }
});

// Run main function
main();
