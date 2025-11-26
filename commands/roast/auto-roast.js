const { SlashCommandBuilder } = require('discord.js');
const { hasAdminPermission, checkCooldown } = require('../../permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('auto-roast')
        .setDescription('Configure automatic roasting for inappropriate language')
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enable automatic roasting in this server')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable automatic roasting in this server')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check the current status of automatic roasting')
        ),
    
    async execute(interaction) {
        // Check cooldown (5 seconds)
        if (!await checkCooldown(interaction, 'auto-roast', 5000)) {
            return;
        }
        
        if (!await hasAdminPermission(interaction)) {
            return await interaction.reply({
                content: 'Only administrators can use this command.',
                ephemeral: true
            });
        }
        
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        
        try {
            // For now, we'll use a simple in-memory storage
            // In a production environment, you'd want to store this in your database
            const { autoRoastSettings } = require('../../permissions');
            
            switch (subcommand) {
                case 'enable':
                    autoRoastSettings.set(guildId, true);
                    await interaction.reply('✅ Automatic roasting enabled for this server. The bot will now respond to inappropriate language with custom roasts.');
                    break;
                    
                case 'disable':
                    autoRoastSettings.set(guildId, false);
                    await interaction.reply('❌ Automatic roasting disabled for this server.');
                    break;
                    
                case 'status':
                    const isEnabled = autoRoastSettings.get(guildId) ?? true; // Default to enabled
                    await interaction.reply(`🔍 Automatic roasting is currently **${isEnabled ? 'enabled' : 'disabled'}** for this server.`);
                    break;
            }
        } catch (error) {
            console.error('Error in auto-roast command:', error);
            await interaction.reply({
                content: 'There was an error executing this command. Please try again later.',
                ephemeral: true
            });
        }
    }
};
