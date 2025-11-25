const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadUserConfig, deleteUserConfig } = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-config')
        .setDescription('Delete your email configuration and stop any active monitoring'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const discordUserId = interaction.user.id;
            
            // Check if user has a configuration
            const userConfig = await loadUserConfig(discordUserId);
            
            if (!userConfig) {
                return await interaction.editReply({
                    content: '❌ You do not have any email configuration to delete.'
                });
            }

            // Stop monitoring if active
            if (interaction.client.emailMonitors && interaction.client.emailMonitors.has(discordUserId)) {
                const monitor = interaction.client.emailMonitors.get(discordUserId);
                if (monitor.isMonitoring) {
                    monitor.stopMonitoring();
                }
                interaction.client.emailMonitors.delete(discordUserId);
            }

            // Delete user configuration
            const deleted = await deleteUserConfig(discordUserId);

            if (deleted) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🗑️ Configuration Deleted')
                    .setDescription('Your email configuration has been successfully deleted.')
                    .addFields(
                        { name: 'User', value: userConfig.discordUsername, inline: true },
                        { name: 'Email', value: `\`${userConfig.riot.email}\``, inline: true },
                        { name: 'Monitoring Stopped', value: '✅ Yes', inline: true }
                    )
                    .setFooter({ text: 'All your data has been permanently removed.' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({
                    content: '❌ Failed to delete your configuration. Please try again.'
                });
            }

        } catch (error) {
            console.error('Error deleting config:', error);
            await interaction.editReply({
                content: `❌ Failed to delete configuration: ${error.message}`
            });
        }
    },
};