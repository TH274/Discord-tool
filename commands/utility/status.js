const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadUserConfig, getAllUserConfigs } = require('../../config');
const { hasAdminPermission } = require('../../permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check the status of your email monitoring and view all active monitors'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const discordUserId = interaction.user.id;
            
            // Check if user has a monitor running
            const userMonitor = interaction.client.emailMonitors && interaction.client.emailMonitors.has(discordUserId);
            const userConfig = await loadUserConfig(discordUserId);
            
            // Create user status embed
            const userStatusEmbed = new EmbedBuilder()
                .setColor(userMonitor ? 0x00FF00 : 0xFFA500)
                .setTitle('📊 Your Email Monitor Status')
                .addFields(
                    { 
                        name: 'Monitor Status', 
                        value: userMonitor ? '🟢 Active' : '🔴 Inactive', 
                        inline: true 
                    },
                    { 
                        name: 'Configured', 
                        value: userConfig ? '✅ Yes' : '❌ No', 
                        inline: true 
                    }
                )
                .setTimestamp();

            if (userConfig) {
                userStatusEmbed.addFields(
                    { 
                        name: 'Email', 
                        value: `\`${userConfig.riot.email}\``, 
                        inline: true 
                    },
                    { 
                        name: 'Channel', 
                        value: `<#${userConfig.riot.channelId}>`, 
                        inline: true 
                    }
                );
            } else {
                userStatusEmbed.addFields(
                    { 
                        name: 'Setup Required', 
                        value: 'Use `/setup-email` to configure your email monitoring', 
                        inline: false 
                    }
                );
            }

            // Get all active monitors (admin/moderator only)
            const isAdmin = await hasAdminPermission(interaction);

            let allMonitorsEmbed = null;
            
            if (isAdmin) {
                try {
                    const allConfigs = await getAllUserConfigs();
                    const activeMonitors = [];
                    
                    // Check which users have active monitors
                    if (interaction.client.emailMonitors) {
                        for (const [userId, monitor] of interaction.client.emailMonitors) {
                            if (monitor.isMonitoring) {
                                const config = allConfigs.find(c => c.discordUserId === userId);
                                if (config) {
                                    activeMonitors.push({
                                        username: config.discordUsername,
                                        email: config.riot.email,
                                        channel: config.riot.channelId,
                                        status: '🟢 Active'
                                    });
                                }
                            }
                        }
                    }

                    // Add configured but inactive monitors
                    for (const config of allConfigs) {
                        const isActive = activeMonitors.some(m => m.username === config.discordUsername);
                        if (!isActive) {
                            activeMonitors.push({
                                username: config.discordUsername,
                                email: config.riot.email,
                                channel: config.riot.channelId,
                                status: '🔴 Inactive'
                            });
                        }
                    }

                    allMonitorsEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('📋 All Email Monitors')
                        .setDescription(`Total configured users: ${allConfigs.length}`)
                        .setTimestamp();

                    if (activeMonitors.length > 0) {
                        const monitorList = activeMonitors.map(monitor => 
                            `**${monitor.username}**\n` +
                            `Status: ${monitor.status}\n` +
                            `Email: \`${monitor.email}\`\n` +
                            `Channel: <#${monitor.channel}>\n`
                        ).join('\n');

                        allMonitorsEmbed.addFields({
                            name: 'Configured Monitors',
                            value: monitorList.length > 1024 ? monitorList.substring(0, 1021) + '...' : monitorList
                        });
                    } else {
                        allMonitorsEmbed.addFields({
                            name: 'Configured Monitors',
                            value: 'No monitors configured yet.'
                        });
                    }

                } catch (error) {
                    console.error('Error fetching all monitors:', error);
                }
            }

            // Send responses
            await interaction.editReply({ embeds: [userStatusEmbed] });
            
            if (allMonitorsEmbed) {
                await interaction.followUp({ embeds: [allMonitorsEmbed] });
            }

        } catch (error) {
            console.error('Error checking status:', error);
            await interaction.editReply({
                content: `❌ Failed to check status: ${error.message}`
            });
        }
    },
};