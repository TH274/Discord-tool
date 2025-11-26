const { SlashCommandBuilder } = require('discord.js');
const { canRoastUser, getCustomRoasts, checkCooldown } = require('../../permissions');
const { defaultRoasts } = require('../../constants');

module.exports = {
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
        // Check cooldown (5 seconds)
        if (!await checkCooldown(interaction, 'roast', 5000)) {
            return;
        }
        
        const target = interaction.options.getUser('target');
        const category = interaction.options.getString('category') || 'general';
        
        // Check if user can be roasted
        const canRoast = await canRoastUser(interaction, target.id);
        if (!canRoast.allowed) {
            return await interaction.reply(canRoast.reason);
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