const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const { containsInappropriateContent, getCustomRoasts, getUserOptOut, checkCooldown } = require('../../permissions');
const { defaultRoasts } = require('../../constants');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Report Inappropriate')
        .setType(ApplicationCommandType.Message),
    
    async execute(interaction) {
        // Check cooldown (5 seconds)
        if (!await checkCooldown(interaction, 'report-inappropriate', 5000)) {
            return;
        }
        
        const targetMessage = interaction.targetMessage;
        const targetUser = targetMessage.author;
        
        // Prevent self-reporting
        if (targetUser.id === interaction.user.id) {
            return await interaction.reply({
                content: "You can't report your own message! If you think your message is inappropriate, just delete it.",
                ephemeral: true
            });
        }
        
        // Check if the reported message contains inappropriate content
        if (!containsInappropriateContent(targetMessage.content)) {
            return await interaction.reply({
                content: "This message doesn't appear to contain inappropriate content. Please only report messages that actually violate community guidelines.",
                ephemeral: true
            });
        }
        
        try {
            // Check if target user has opted out of roasts
            const userOptedOut = await getUserOptOut(targetUser.id);
            if (userOptedOut) {
                return await interaction.reply({
                    content: "This user has opted out of being roasted.",
                    ephemeral: true
                });
            }
            
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
            await interaction.reply({
                content: `**${targetUser.username}**, ${randomRoast}`,
                allowedMentions: { users: [targetUser.id] }
            });
            
        } catch (error) {
            console.error('Error in report-inappropriate command:', error);
            await interaction.reply({
                content: 'There was an error processing this report. Please try again later.',
                ephemeral: true
            });
        }
    }
};