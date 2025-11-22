const { connectToDatabase } = require('./db/database');
const crypto = require('crypto');

// Optional encryption key for sensitive fields (set as 64 hex chars = 32 bytes)
const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || null;
const IV_LENGTH = 12;

function encryptText(text) {
    if (!ENCRYPTION_KEY || !text) return text;
    try {
        const key = Buffer.from(ENCRYPTION_KEY, 'hex');
        if (key.length !== 32) {
            console.warn('CONFIG_ENCRYPTION_KEY must be 32 bytes (64 hex chars). Falling back to plain text.');
            return text;
        }
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (e) {
        console.warn('Encryption failed, storing plain text');
        return text;
    }
}

function decryptText(enc) {
    if (!ENCRYPTION_KEY || !enc) return enc;
    try {
        const key = Buffer.from(ENCRYPTION_KEY, 'hex');
        const parts = String(enc).split(':');
        if (parts.length !== 3) return enc;
        const iv = Buffer.from(parts[0], 'hex');
        const tag = Buffer.from(parts[1], 'hex');
        const encrypted = Buffer.from(parts[2], 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    } catch (e) {
        console.warn('Decryption failed, returning raw value');
        return enc;
    }
}

async function loadConfig() {
    const db = await connectToDatabase();
    const collection = db.collection("config");

    // Get config document
    let config = await collection.findOne({ _id: "main" });

    if (!config) {
        console.warn("⚠ No config found, creating empty config document...");

        config = {
            _id: "main",
            token: process.env.DISCORD_TOKEN || "",
            clientId: process.env.DISCORD_CLIENT_ID || "",
            guildId: process.env.DISCORD_GUILD_ID || "",
            riot: {
                email: "",
                emailPassword: "",
                channelId: "",
                imapHost: "imap.gmail.com",
                imapPort: 993
            }
        };

        await collection.insertOne(config);
    }

    return {
        token: process.env.DISCORD_TOKEN || config.token,
        clientId: process.env.DISCORD_CLIENT_ID || config.clientId,
        guildId: process.env.DISCORD_GUILD_ID || config.guildId,
        riot: {
            email: process.env.RIOT_EMAIL || config.riot?.email || "",
            emailPassword: process.env.RIOT_EMAIL_PASSWORD || decryptText(config.riot?.emailPassword) || "",
            channelId: process.env.RIOT_CHANNEL_ID || config.riot?.channelId || "",
            imapHost: process.env.RIOT_IMAP_HOST || config.riot?.imapHost || "imap.gmail.com",
            imapPort: parseInt(process.env.RIOT_IMAP_PORT || config.riot?.imapPort || 993, 10),
            // Optional: allow self-signed certificates when true (boolean)
            allowSelfSigned: (typeof config.riot?.allowSelfSigned !== 'undefined')
                ? !!config.riot.allowSelfSigned
                : (process.env.RIOT_ALLOW_SELF_SIGNED === 'true'),
            // Optional: path to PEM file containing additional CA(s)
            caPath: process.env.RIOT_CA_PATH || config.riot?.caPath || ""
        }
    };
}

async function saveConfig(newConfig) {
    const db = await connectToDatabase();
    const collection = db.collection("config");

    // If an encryption key is configured, encrypt sensitive fields before saving
    if (newConfig && newConfig.riot && newConfig.riot.emailPassword) {
        newConfig.riot.emailPassword = encryptText(newConfig.riot.emailPassword);
    }

    await collection.updateOne(
        { _id: "main" },
        { $set: newConfig },
        { upsert: true }
    );

    console.log("Config saved to MongoDB");
    return true;
}

module.exports = { loadConfig, saveConfig };
