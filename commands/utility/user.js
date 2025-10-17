const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName('user').setDescription('Replies with user info!'),
    async execute(interaction) {
        await interaction.reply(
            'This command was executed by ' + interaction.user.username + '#' + interaction.user.discriminator
        )
    },
};