const { Events } = require('discord.js');
const { containsInappropriateContent, getCustomRoasts, getUserOptOut, autoRoastSettings } = require('../permissions');
const { defaultRoasts } = require('../constants');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore bot messages and DMs
        if (message.author.bot || !message.guild) return;
        
        // Check if auto-roast is enabled for this server (default to enabled)
        const guildId = message.guild.id;
        const isAutoRoastEnabled = autoRoastSettings.get(guildId) ?? true;
        
        if (!isAutoRoastEnabled) return;
        
        // Check if message contains inappropriate content
        if (containsInappropriateContent(message.content)) {
            try {
                // Check if user has opted out of roasts
                const userOptedOut = await getUserOptOut(message.author.id);
                if (userOptedOut) return;
                
                // Get custom roasts for 'inappropriate' category, fallback to 'general'
                let customRoasts = await getCustomRoasts('inappropriate');
                if (customRoasts.length === 0) {
                    customRoasts = await getCustomRoasts('general');
                }
                
                // Combine default and custom roasts
                const defaultInappropriateRoasts = defaultRoasts.inappropriate || [];
                const allRoasts = [...defaultInappropriateRoasts, ...customRoasts];
                
                // If no roasts available, use a default response
                if (allRoasts.length === 0) {
                    allRoasts.push("Watch your language! This is a family-friendly server.");
                }
                
                // Select random roast
                const randomRoast = allRoasts[Math.floor(Math.random() * allRoasts.length)];
                
                // Reply with the roast
                await message.reply(`**${message.author.username}**, ${randomRoast}`);
            } catch (error) {
                console.error('Error handling inappropriate content:', error);
            }
        }
    },
};