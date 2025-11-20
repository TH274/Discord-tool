// Configuration loader - supports both config.json and environment variables
const fs = require('fs');
const path = require('path');

function loadConfig() {
    // Try to load from config.json first (for local development)
    const configPath = path.join(__dirname, 'config.json');
    let config = {};

    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log('Loaded configuration from config.json');
        } catch (error) {
            console.warn('Failed to load config.json:', error.message);
        }
    }

    // Override with environment variables (for production/Render.com)
    const finalConfig = {
        token: process.env.DISCORD_TOKEN || config.token,
        clientId: process.env.DISCORD_CLIENT_ID || config.clientId,
        guildId: process.env.DISCORD_GUILD_ID || config.guildId,
        riot: {
            email: process.env.RIOT_EMAIL || config.riot?.email || '',
            emailPassword: process.env.RIOT_EMAIL_PASSWORD || config.riot?.emailPassword || '',
            channelId: process.env.RIOT_CHANNEL_ID || config.riot?.channelId || '',
            imapHost: process.env.RIOT_IMAP_HOST || config.riot?.imapHost || 'imap.gmail.com',
            imapPort: parseInt(process.env.RIOT_IMAP_PORT || config.riot?.imapPort || '993', 10)
        }
    };

    // Validate required fields
    if (!finalConfig.token) {
        throw new Error('Missing DISCORD_TOKEN - set it in config.json or environment variable');
    }
    if (!finalConfig.clientId) {
        throw new Error('Missing DISCORD_CLIENT_ID - set it in config.json or environment variable');
    }

    return finalConfig;
}

function saveConfig(newConfig) {
    const configPath = path.join(__dirname, 'config.json');

    // If we're using environment variables (production), don't save to file
    if (process.env.DISCORD_TOKEN) {
        console.log('Running in production mode - config changes not saved to file');
        return false;
    }

    // Load existing config
    let config = {};
    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            console.warn('Failed to load existing config.json:', error.message);
        }
    }

    // Merge with new config
    const updatedConfig = { ...config, ...newConfig };

    // Save to file
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, '\t'));
    console.log('Configuration saved to config.json');
    return true;
}

module.exports = {
    loadConfig,
    saveConfig
};
