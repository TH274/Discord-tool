const { connectToDatabase } = require('./db/database');

async function loadConfig() {
    // Load global bot configuration (Discord tokens, etc.)
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
            guildId: process.env.DISCORD_GUILD_ID || ""
        };

        await collection.insertOne(config);
    }

    return {
        token: process.env.DISCORD_TOKEN || config.token,
        clientId: process.env.DISCORD_CLIENT_ID || config.clientId,
        guildId: process.env.DISCORD_GUILD_ID || config.guildId
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

    console.log("Global config saved to MongoDB");
    return true;
}

async function loadUserConfig(discordUserId) {
    const db = await connectToDatabase();
    const collection = db.collection("user_configs");
    
    let config = await collection.findOne({ discordUserId });
    
    if (!config) {
        return null; // No config found for this user
    }
    
    return config;
}

async function saveUserConfig(discordUserId, discordUsername, riotConfig) {
    const db = await connectToDatabase();
    const collection = db.collection("user_configs");
    
    await collection.updateOne(
        { discordUserId },
        {
            $set: {
                discordUserId,
                discordUsername,
                riot: riotConfig,
                updatedAt: new Date()
            },
            $setOnInsert: {
                createdAt: new Date()
            }
        },
        { upsert: true }
    );

    console.log(`User config saved for ${discordUsername} (${discordUserId})`);
    return true;
}

async function deleteUserConfig(discordUserId) {
    const db = await connectToDatabase();
    const collection = db.collection("user_configs");
    
    const result = await collection.deleteOne({ discordUserId });
    
    if (result.deletedCount > 0) {
        console.log(`User config deleted for ${discordUserId}`);
        return true;
    }
    
    return false;
}

async function getAllUserConfigs() {
    const db = await connectToDatabase();
    const collection = db.collection("user_configs");
    
    const configs = await collection.find({}).toArray();
    return configs;
}

// Roast-related functions
async function saveCustomRoast(discordUserId, roastText, category = 'general') {
    const db = await connectToDatabase();
    const collection = db.collection("custom_roasts");
    
    await collection.insertOne({
        discordUserId,
        roastText,
        category,
        createdAt: new Date()
    });

    console.log(`Custom roast saved for user ${discordUserId}`);
    return true;
}

async function getCustomRoasts(category = null) {
    const db = await connectToDatabase();
    const collection = db.collection("custom_roasts");
    
    const query = category ? { category } : {};
    const roasts = await collection.find(query).toArray();
    return roasts.map(r => r.roastText);
}

async function setUserOptOut(discordUserId, optOut = true) {
    const db = await connectToDatabase();
    const collection = db.collection("user_configs");
    
    await collection.updateOne(
        { discordUserId },
        {
            $set: {
                'roast.optOut': optOut,
                updatedAt: new Date()
            }
        },
        { upsert: true }
    );

    console.log(`User ${discordUserId} opt-out status set to: ${optOut}`);
    return true;
}

async function getUserOptOut(discordUserId) {
    const db = await connectToDatabase();
    const collection = db.collection("user_configs");
    
    const config = await collection.findOne({ discordUserId });
    return config && config.roast && config.roast.optOut ? true : false;
}

module.exports = {
    loadConfig,
    saveConfig,
    loadUserConfig,
    saveUserConfig,
    deleteUserConfig,
    getAllUserConfigs,
    saveCustomRoast,
    getCustomRoasts,
    setUserOptOut,
    getUserOptOut
};
