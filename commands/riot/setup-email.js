const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

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
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('Channel ID where codes will be posted')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 }); // 64 = Ephemeral flag

        const email = interaction.options.getString('email');
        const password = interaction.options.getString('password');
        const channelId = interaction.options.getString('channel');

        // Verify channel exists
        let channel = interaction.client.channels.cache.get(channelId);
        if (!channel) {
            try {
                channel = await interaction.client.channels.fetch(channelId);
            } catch (error) {
                return await interaction.editReply({
                    content: '❌ Invalid channel ID. Please provide a valid channel ID or make sure the bot has access to that channel.'
                });
            }
        }

        try {
            // Read config
            const configPath = path.join(__dirname, '..', '..', 'config.json');
            let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            // Update config
            config.riot = {
                email: email,
                emailPassword: password,
                channelId: channelId,
                imapHost: 'imap.gmail.com',
                imapPort: 993
            };

            // Save config
            fs.writeFileSync(configPath, JSON.stringify(config, null, '\t'));

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Email Setup Complete')
                .setDescription('Your email credentials have been saved.')
                .addFields(
                    { name: 'Email', value: email, inline: true },
                    { name: 'Channel', value: `<#${channelId}>`, inline: true }
                )
                .setFooter({ text: 'Use /start-monitor to begin monitoring' })
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
