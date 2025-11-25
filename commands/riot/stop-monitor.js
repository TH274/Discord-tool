const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadUserConfig } = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop-monitor')
        .setDescription('Stop monitoring Gmail for Riot 2FA codes'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const discordUserId = interaction.user.id;
            
            // Check if user has a monitor running
            if (!interaction.client.emailMonitors || !interaction.client.emailMonitors.has(discordUserId)) {
                return await interaction.editReply('⚠️ You do not have email monitoring active.');
            }

            const monitor = interaction.client.emailMonitors.get(discordUserId);
            
            if (!monitor.isMonitoring) {
                return await interaction.editReply('⚠️ Your email monitoring is not currently active.');
            }

            // Get user config for display purposes
            const userConfig = await loadUserConfig(discordUserId);
            const username = userConfig ? userConfig.discordUsername : interaction.user.tag;

            // Stop monitoring
            monitor.stopMonitoring();
            interaction.client.emailMonitors.delete(discordUserId);

            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🛑 Email Monitoring Stopped')
                .setDescription(`Gmail monitoring has been stopped for ${username}`)
                .addFields(
                    { name: 'User', value: username, inline: true },
                    { name: 'Status', value: 'Stopped', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error stopping monitor:', error);
            await interaction.editReply({
                content: `❌ Failed to stop monitoring: ${error.message}`
            });
        }
    },
};
