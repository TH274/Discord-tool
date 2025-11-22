const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadConfig } = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('email-status')
        .setDescription('Check the current email configuration for Riot 2FA monitoring'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // Admin only
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.editReply("❌ You must be an administrator to run this command.");
        }

        try {
            const config = await loadConfig();

            if (!config) {
                return interaction.editReply("❌ Email not configured. Use `/setup-email` first.");
            }

            // Validate channel
            let channel = interaction.client.channels.cache.get(config.channelId);
            if (!channel) {
                try {
                    channel = await interaction.client.channels.fetch(config.channelId);
                } catch (e) {
                    return interaction.editReply("❌ Channel not found. Run `/setup-email` again.");
                }
            }

            // Get the riot config
            const riotConfig = config.riot || {};

            // Build response
            const message =
                `**📧 Email Configuration**\n` +
                `**Email:** ${riotConfig.email || 'Not configured'}\n` +
                `**Channel:** <#${riotConfig.channelId || 'Not configured'}>\n` +
                `**IMAP:** ${riotConfig.imapHost || 'Not configured'}:${riotConfig.imapPort || 'Not configured'}\n` +
                `**Allow Self-Signed Certs:** ${riotConfig.allowSelfSigned ? '✅ Yes' : '❌ No'}\n`;

            return interaction.editReply({ content: message, ephemeral: true });

        } catch (err) {
            console.error("Email status error:", err);
            return interaction.editReply("❌ Error while reading email status from database.");
        }
    }
};