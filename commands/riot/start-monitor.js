const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EmailMonitor = require('../../services/emailMonitor');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start-monitor')
        .setDescription('Start monitoring Gmail for Riot 2FA codes'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Check if already monitoring
            if (interaction.client.emailMonitor && interaction.client.emailMonitor.isMonitoring) {
                return await interaction.editReply('⚠️ Email monitoring is already active!');
            }

            // Read config
            const configPath = path.join(__dirname, '..', '..', 'config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            if (!config.riot || !config.riot.email || !config.riot.emailPassword) {
                return await interaction.editReply({
                    content: '❌ Email not configured. Please use `/setup-email` first.'
                });
            }

            // Get channel for posting codes
            const channelId = config.riot.channelId;
            const channel = interaction.client.channels.cache.get(channelId);

            if (!channel) {
                return await interaction.editReply({
                    content: '❌ Configured channel not found. Please run `/setup-email` again.'
                });
            }

            // Create and start email monitor
            const monitor = new EmailMonitor(config.riot);
            interaction.client.emailMonitor = monitor;

            // Listen for codes
            monitor.on('codeFound', async (data) => {
                const codeEmbed = new EmbedBuilder()
                    .setColor(0xFF4655)
                    .setTitle('🔐 Riot 2FA Code Received')
                    .setDescription(`**Code:** \`${data.code}\``)
                    .addFields(
                        { name: 'Subject', value: data.subject || 'N/A', inline: false },
                        { name: 'From', value: data.from || 'N/A', inline: true },
                        { name: 'Received', value: `<t:${Math.floor(data.date.getTime() / 1000)}:R>`, inline: true }
                    )
                    .setTimestamp();

                await channel.send({ embeds: [codeEmbed] });
            });

            monitor.on('error', (error) => {
                console.error('Email monitor error:', error);
                channel.send(`⚠️ Email monitoring error: ${error.message}`);
            });

            monitor.on('disconnected', () => {
                channel.send('⚠️ Email monitoring disconnected');
            });

            // Start monitoring
            monitor.startMonitoring();

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Email Monitoring Started')
                .setDescription('Now monitoring your Gmail for Riot 2FA codes')
                .addFields(
                    { name: 'Email', value: config.riot.email, inline: true },
                    { name: 'Posting to', value: `<#${channelId}>`, inline: true }
                )
                .setFooter({ text: 'Codes will be automatically posted when received' })
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
