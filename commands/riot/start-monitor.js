const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const EmailMonitor = require('../../services/emailMonitor');
const { loadConfig } = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start-monitor')
        .setDescription('Start monitoring Gmail for Riot 2FA codes'),

    async execute(interaction) {
        await interaction.deferReply();

        // Restrict command to server administrators
        if (!interaction.member || !interaction.member.permissions || !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.editReply({ content: '❌ You must be a server administrator to run this command.', ephemeral: true });
        }

        try {
            if (interaction.client.emailMonitor && interaction.client.emailMonitor.isMonitoring) {
                return await interaction.editReply('⚠️ Email monitoring is already active!');
            }

            const config = await loadConfig();

            if (
                !config.riot ||
                !config.riot.email ||
                !config.riot.emailPassword ||
                !config.riot.channelId
            ) {
                return await interaction.editReply({
                    content: '❌ Email not configured. Use `/setup-email` first.'
                });
            }

            const channelId = config.riot.channelId;
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

            const monitor = new EmailMonitor(config.riot);
            interaction.client.emailMonitor = monitor;

            monitor.on('codeFound', async (data) => {
                const codeEmbed = new EmbedBuilder()
                    .setColor(0xFF4655)
                    .setTitle('🔐 Riot 2FA Code Received')
                    .setDescription(`**Code:** \`${data.code}\``)
                    .addFields(
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
                .setDescription('Now monitoring Gmail for Riot 2FA codes.')
                .addFields(
                    { name: 'Email', value: config.riot.email, inline: true },
                    { name: 'Posting to', value: `<#${channelId}>`, inline: true }
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
