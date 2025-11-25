const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EmailMonitor = require('../../services/emailMonitor');
const { loadUserConfig } = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start-monitor')
        .setDescription('Start monitoring Gmail for Riot 2FA codes'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const discordUserId = interaction.user.id;
            
            // Check if user already has a monitor running
            if (interaction.client.emailMonitors && interaction.client.emailMonitors.has(discordUserId)) {
                const existingMonitor = interaction.client.emailMonitors.get(discordUserId);
                if (existingMonitor.isMonitoring) {
                    return await interaction.editReply('⚠️ You already have email monitoring active!');
                }
            }

            // Load user-specific configuration
            const userConfig = await loadUserConfig(discordUserId);

            if (
                !userConfig ||
                !userConfig.riot ||
                !userConfig.riot.email ||
                !userConfig.riot.emailPassword ||
                !userConfig.riot.channelId
            ) {
                return await interaction.editReply({
                    content: '❌ Email not configured. Use `/setup-email` first.'
                });
            }

            const channelId = userConfig.riot.channelId;
            let channel = interaction.client.channels.cache.get(channelId);

            if (!channel) {
                try {
                    channel = await interaction.client.channels.fetch(channelId);
                } catch (error) {
                    return await interaction.editReply({
                        content: '❌ Configured channel not found. Please run `/setup-email` again.'
                    });
                }
            }

            // Initialize email monitors map if it doesn't exist
            if (!interaction.client.emailMonitors) {
                interaction.client.emailMonitors = new Map();
            }

            const monitor = new EmailMonitor(userConfig.riot);
            interaction.client.emailMonitors.set(discordUserId, monitor);

            monitor.on('codeFound', async (data) => {
                const codeEmbed = new EmbedBuilder()
                    .setColor(0xFF4655)
                    .setTitle('🔐 Riot 2FA Code Received')
                    .setDescription(`**Code:** \`${data.code}\``)
                    .addFields(
                        { name: 'User', value: userConfig.discordUsername, inline: true },
                        { name: 'Subject', value: data.subject || 'N/A' },
                        { name: 'From', value: data.from || 'N/A', inline: true },
                        {
                            name: 'Received',
                            value: `<t:${Math.floor(data.date.getTime() / 1000)}:R>`,
                            inline: true
                        }
                    )
                    .setTimestamp();

                await channel.send({ embeds: [codeEmbed] });
            });

            monitor.on('error', (error) => {
                console.error(`Email monitor error for ${userConfig.discordUsername}:`, error);
                channel.send(`⚠️ Email monitoring error: ${error.message}`);
            });

            monitor.on('disconnected', () => {
                channel.send(`⚠️ Email monitoring disconnected for ${userConfig.discordUsername}`);
                // Clean up the monitor from the map
                interaction.client.emailMonitors.delete(discordUserId);
            });

            // Start monitoring
            monitor.startMonitoring();

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Email Monitoring Started')
                .setDescription(`Now monitoring Gmail for Riot 2FA codes for ${userConfig.discordUsername}.`)
                .addFields(
                    { name: 'Email', value: userConfig.riot.email, inline: true },
                    { name: 'Posting to', value: `<#${channelId}>`, inline: true },
                    { name: 'User', value: userConfig.discordUsername, inline: true }
                )
                .setFooter({ text: 'Codes will appear automatically when received.' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error starting monitor:', error);
            await interaction.editReply({
                content: `❌ Failed to start monitoring: ${error.message}`
            });
        }
    },
};
