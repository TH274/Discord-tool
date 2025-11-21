const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
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
                .setDescription('Your Gmail App Password (not your normal password)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel where codes will be posted')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const email = interaction.options.getString('email');
        const password = interaction.options.getString('password');
        const channel = interaction.options.getChannel('channel');

        // Validate channel type
        if (!channel || channel.type !== ChannelType.GuildText) {
            return await interaction.editReply({
                content: '❌ Please select a valid text channel.'
            });
        }

        // Check bot permission
        const permissions = channel.permissionsFor(interaction.client.user);
        if (!permissions || !permissions.has(PermissionFlagsBits.SendMessages)) {
            return await interaction.editReply({
                content: `❌ I don't have permission to send messages in ${channel}.`
            });
        }

        try {
            // Load current configuration from MongoDB
            const config = await loadConfig();

            // Update Riot email configuration
            const newConfig = {
                riot: {
                    email: email,
                    emailPassword: password,
                    channelId: channel.id,
                    imapHost: "imap.gmail.com",
                    imapPort: 993
                }
            };

            // Save to MongoDB
            await saveConfig(newConfig);

            // Confirmation embed
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Email Setup Complete')
                .setDescription('Your Riot email settings have been saved to MongoDB.')
                .addFields(
                    { name: 'Email', value: email, inline: true },
                    { name: 'Channel', value: `${channel}`, inline: true }
                )
                .setFooter({ text: 'Use /start-monitor to begin monitoring emails.' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Error saving email config:", error);
            await interaction.editReply({
                content: '❌ Failed to save email configuration. Check logs.'
            });
        }
    }
};
