const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { saveUserConfig } = require('../../config');
const { canSendMessages } = require('../../permissions');

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
                .setRequired(true)),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const email = interaction.options.getString('email');
        const password = interaction.options.getString('password');
        const channel = interaction.channel; // Use current channel where command was executed
        const discordUserId = interaction.user.id;
        const discordUsername = interaction.user.tag;

        // Check bot permission in current channel
        if (!await canSendMessages(interaction, channel)) {
            return await interaction.editReply({
                content: `❌ I don't have permission to send messages in this channel (${channel.name}).`
            });
        }

        try {
            // Create user-specific Riot email configuration
            const riotConfig = {
                email: email,
                emailPassword: password,
                channelId: channel.id,
                channelName: channel.name,
                guildId: interaction.guild.id,
                guildName: interaction.guild.name,
                imapHost: "imap.gmail.com",
                imapPort: 993
            };

            // Save user-specific configuration to MongoDB
            await saveUserConfig(discordUserId, discordUsername, riotConfig);

            // Confirmation embed
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Email Setup Complete')
                .setDescription(`Your Riot email settings have been saved for ${discordUsername}.`)
                .addFields(
                    { name: 'Email', value: email, inline: true },
                    { name: 'Channel', value: `${channel} (current channel)`, inline: true },
                    { name: 'User', value: discordUsername, inline: true }
                )
                .setFooter({ text: 'Use /start-monitor to begin monitoring emails.' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Error saving user email config:", error);
            await interaction.editReply({
                content: '❌ Failed to save email configuration. Check logs.'
            });
        }
    }
};
