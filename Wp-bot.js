// SAFE WHATSAPP BOT – CLEAN TEMPLATE
// Works with @whiskeysockets/baileys

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  delay
} from "@whiskeysockets/baileys"
import pino from "pino"

async function startBot() {
  // Load / save auth files
  const { state, saveCreds } = await useMultiFileAuthState("./auth")

  // Create WhatsApp connection
  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    auth: state
  })

  // Auto-save credentials
  sock.ev.on("creds.update", saveCreds)

  // Connection updates
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "open") {
      console.log("✅ WhatsApp logged in successfully!")
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut

      if (shouldReconnect) {
        console.log("⚠ Connection lost. Reconnecting…")
        startBot()
      } else {
        console.log("❌ Logged out. Please delete /auth and restart.")
      }
    }
  })

  // Listen for messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text

    console.log(`📩 Message from ${from}: ${text}`)

    // ---- SAFE AUTO-REPLY EXAMPLE ----
    if (text?.toLowerCase() === "hi") {
      await sock.sendMessage(from, { text: "Hello! How can I help you?" })
    }
  })
}

startBot()
