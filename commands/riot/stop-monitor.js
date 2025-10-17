const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop-monitor')
        .setDescription('Stop monitoring Gmail for Riot 2FA codes'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Check if monitoring
            if (!interaction.client.emailMonitor || !interaction.client.emailMonitor.isMonitoring) {
                return await interaction.editReply('⚠️ Email monitoring is not active.');
            }

            // Stop monitoring
            interaction.client.emailMonitor.stopMonitoring();
            interaction.client.emailMonitor = null;

            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🛑 Email Monitoring Stopped')
                .setDescription('Gmail monitoring has been stopped')
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
