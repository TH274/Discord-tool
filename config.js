const { connectToDatabase } = require('./db/database');

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
            emailPassword: process.env.RIOT_EMAIL_PASSWORD || config.riot?.emailPassword || "",
            channelId: process.env.RIOT_CHANNEL_ID || config.riot?.channelId || "",
            imapHost: process.env.RIOT_IMAP_HOST || config.riot?.imapHost || "imap.gmail.com",
            imapPort: parseInt(process.env.RIOT_IMAP_PORT || config.riot?.imapPort || 993, 10)
        }
    };
}

async function saveConfig(newConfig) {
    const db = await connectToDatabase();
    const collection = db.collection("config");

    await collection.updateOne(
        { _id: "main" },
        { $set: newConfig },
        { upsert: true }
    );

    console.log("Config saved to MongoDB");
    return true;
}

module.exports = { loadConfig, saveConfig };
