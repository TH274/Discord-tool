const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { setUserOptOut, getUserOptOut } = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('opt-out')
        .setDescription('Opt-out or opt-in to being roasted')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Choose to opt-out or opt-in')
                .addChoices(
                    { name: 'Opt-out (don\'t roast me)', value: 'optout' },
                    { name: 'Opt-in (roast me again)', value: 'optin' }
                )
                .setRequired(false)),
    
    async execute(interaction) {
        const action = interaction.options.getString('action');
        const userId = interaction.user.id;
        
        try {
            // If no action specified, show current status
            if (!action) {
                const currentStatus = await getUserOptOut(userId);
                const embed = new EmbedBuilder()
                    .setColor(currentStatus ? 0xFF0000 : 0x00FF00)
                    .setTitle('🔔 Roast Status')
                    .setDescription(
                        currentStatus 
                            ? 'You are currently **opted-out** from being roasted.' 
                            : 'You are currently **opted-in** to be roasted.'
                    )
                    .addFields(
                        { 
                            name: 'Current Status', 
                            value: currentStatus ? '🚫 Opted-out' : '✅ Opted-in', 
                            inline: true 
                        },
                        { 
                            name: 'To change status', 
                            value: 'Use `/opt-out` with an action parameter', 
                            inline: false 
                        }
                    )
                    .setTimestamp();
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            // Handle opt-out
            if (action === 'optout') {
                await setUserOptOut(userId, true);
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🚫 Opt-out Successful')
                    .setDescription('You have been opted-out from being roasted.')
                    .addFields(
                        { 
                            name: 'What this means', 
                            value: '• Other users cannot roast you\n• You can still roast others\n• You can opt-in anytime with `/opt-out action:optin`', 
                            inline: false 
                        }
                    )
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } 
            // Handle opt-in
            else if (action === 'optin') {
                await setUserOptOut(userId, false);
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Opt-in Successful')
                    .setDescription('You have been opted-in to be roasted.')
                    .addFields(
                        { 
                            name: 'What this means', 
                            value: '• Other users can now roast you\n• You can opt-out anytime with `/opt-out action:optout`', 
                            inline: false 
                        }
                    )
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
        } catch (error) {
            console.error('Error updating opt-out status:', error);
            await interaction.reply({
                content: '❌ Failed to update your opt-out status. Please try again later.',
                ephemeral: true
            });
        }
    }
};