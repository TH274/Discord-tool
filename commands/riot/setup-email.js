const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { loadConfig, saveConfig } = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-email')
        .setDescription('Setup email credentials for monitoring Riot 2FA codes')
        .addStringOption(option =>
            option.setName('email')
                .setDescription('Your Gmail address')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('password')
                .setDescription('Your Gmail App Password (not regular password)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel where codes will be posted')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 }); // 64 = Ephemeral flag

        const email = interaction.options.getString('email');
        const password = interaction.options.getString('password');
        const channel = interaction.options.getChannel('channel');

        // Verify it's a text channel
        if (!channel || channel.type !== ChannelType.GuildText) {
            return await interaction.editReply({
                content: '❌ Please select a valid text channel.'
            });
        }

        // Check if bot has permission to send messages in that channel
        const permissions = channel.permissionsFor(interaction.client.user);
        if (!permissions || !permissions.has('SendMessages')) {
            return await interaction.editReply({
                content: `❌ I don't have permission to send messages in ${channel}. Please grant me "Send Messages" permission in that channel.`
            });
        }

        try {
            // Load current config
            const config = loadConfig();

            // Update riot config
            config.riot = {
                email: email,
                emailPassword: password,
                channelId: channel.id,
                imapHost: 'imap.gmail.com',
                imapPort: 993
            };

            // Save config (only works in local dev, not production)
            const saved = saveConfig(config);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Email Setup Complete')
                .setDescription(saved
                    ? 'Your email credentials have been saved locally.'
                    : 'Configuration updated. Note: In production, you need to set environment variables on Render.com.')
                .addFields(
                    { name: 'Email', value: email, inline: true },
                    { name: 'Channel', value: `${channel}`, inline: true }
                )
                .setFooter({ text: saved ? 'Use /start-monitor to begin monitoring' : 'Restart the bot for changes to take effect' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error saving config:', error);
            await interaction.editReply({
                content: '❌ Failed to save configuration. Check console for errors.'
            });
        }
    },
};
