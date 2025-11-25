const { SlashCommandBuilder } = require('discord.js');
const { saveCustomRoast } = require('../../config');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('add-roast')
        .setDescription('Add a custom roast to the database')
        .addStringOption(option =>
            option.setName('roast')
                .setDescription('The roast to add')
                .setRequired(true)
                .setMaxLength(200))
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Category for the roast')
                .addChoices(
                    { name: 'Programming', value: 'programming' },
                    { name: 'Gaming', value: 'gaming' },
                    { name: 'General', value: 'general' }
                )
                .setRequired(false)),
    
    async execute(interaction) {
        const roastText = interaction.options.getString('roast');
        const category = interaction.options.getString('category') || 'general';
        
        // Basic content moderation
        const bannedWords = ['racial slur', 'homophobic', 'transphobic', 'sexist', 'hate'];
        const containsBannedWord = bannedWords.some(word => 
            roastText.toLowerCase().includes(word)
        );
        
        if (containsBannedWord) {
            return await interaction.reply({
                content: '❌ Your roast contains inappropriate content. Please keep it fun and respectful.',
                ephemeral: true
            });
        }
        
        try {
            await saveCustomRoast(interaction.user.id, roastText, category);
            
            await interaction.reply({
                content: `✅ Your roast has been added to the **${category}** category!\n\n"${roastText}"`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error saving custom roast:', error);
            await interaction.reply({
                content: '❌ Failed to add your roast to the database. Please try again later.',
                ephemeral: true
            });
        }
    }
};