const { SlashCommandBuilder } = require('discord.js');
const { getUserOptOut, getCustomRoasts } = require('../../config');
const { defaultRoasts } = require('../../constants');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('roast')
        .setDescription('Roast a user with different categories')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to roast')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Category of roast')
                .addChoices(
                    { name: 'Programming', value: 'programming' },
                    { name: 'Gaming', value: 'gaming' },
                    { name: 'General', value: 'general' }
                )
                .setRequired(false)),
    
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const category = interaction.options.getString('category') || 'general';
        
        // Prevent self-roasting
        if (target.id === interaction.user.id) {
            return await interaction.reply("You can't roast yourself! That's my job.");
        }
        
        // Check if target has opted out
        const targetOptedOut = await getUserOptOut(target.id);
        if (targetOptedOut) {
            return await interaction.reply(`**${target.username}** has opted out of being roasted. Respect their decision!`);
        }
        
        try {
            // Get custom roasts for this category
            const customRoasts = await getCustomRoasts(category);
            
            // Combine default and custom roasts
            const allRoasts = [...defaultRoasts[category], ...customRoasts];
            
            // Select random roast
            const randomRoast = allRoasts[Math.floor(Math.random() * allRoasts.length)];
            
            await interaction.reply(`**${target.username}**, ${randomRoast}`);
        } catch (error) {
            console.error('Error executing roast command:', error);
            await interaction.reply('Failed to deliver roast. The joke\'s on me this time.');
        }
    }
};