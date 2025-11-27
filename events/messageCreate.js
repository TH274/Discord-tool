const { Events } = require('discord.js');
const { containsInappropriateContent, getCustomRoasts, getUserOptOut, autoRoastSettings } = require('../permissions');
const { defaultRoasts } = require('../constants');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.guild) return;
        
        const guildId = message.guild.id;
        const isAutoRoastEnabled = autoRoastSettings.get(guildId) ?? true;
        
        if (!isAutoRoastEnabled) return;
        
        if (containsInappropriateContent(message.content)) {
            try {
                const userOptedOut = await getUserOptOut(message.author.id);
                if (userOptedOut) return;
                
                let customRoasts = await getCustomRoasts('inappropriate');
                if (customRoasts.length === 0) {
                    customRoasts = await getCustomRoasts('general');
                }
                
                const defaultInappropriateRoasts = defaultRoasts.inappropriate || [];
                const allRoasts = [...defaultInappropriateRoasts, ...customRoasts];
                
                if (allRoasts.length === 0) {
                    allRoasts.push("Watch your language! This is a family-friendly server.");
                }
                
                const randomRoast = allRoasts[Math.floor(Math.random() * allRoasts.length)];
                
                await message.reply(`${randomRoast}`);
            } catch (error) {
                console.error('Error handling inappropriate content:', error);
            }
        }
    },
};