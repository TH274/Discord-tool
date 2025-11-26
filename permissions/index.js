const { connectToDatabase } = require('../db/database');

// Roast-related permission functions
async function saveCustomRoast(discordUserId, roastText, category = 'general') {
    const db = await connectToDatabase();
    const collection = db.collection("custom_roasts");
    
    await collection.insertOne({
        discordUserId,
        roastText,
        category,
        createdAt: new Date()
    });

    console.log(`Custom roast saved for user ${discordUserId}`);
    return true;
}

async function getCustomRoasts(category = null) {
    const db = await connectToDatabase();
    const collection = db.collection("custom_roasts");
    
    const query = category ? { category } : {};
    const roasts = await collection.find(query).toArray();
    return roasts.map(r => r.roastText);
}

async function setUserOptOut(discordUserId, optOut = true) {
    const db = await connectToDatabase();
    const collection = db.collection("user_configs");
    
    await collection.updateOne(
        { discordUserId },
        { 
            $set: { 
                'roast.optOut': optOut,
                updatedAt: new Date()
            }
        },
        { upsert: true }
    );

    console.log(`User ${discordUserId} opt-out status set to: ${optOut}`);
    return true;
}

async function getUserOptOut(discordUserId) {
    const db = await connectToDatabase();
    const collection = db.collection("user_configs");
    
    const config = await collection.findOne({ discordUserId });
    return config && config.roast && config.roast.optOut ? true : false;
}

// General permission checking functions
async function hasAdminPermission(interaction) {
    if (!interaction.guild) return false;
    
    const member = await interaction.guild.members.fetch(interaction.user.id);
    return member.permissions.has('Administrator') || 
           member.permissions.has('ManageGuild');
}

async function canRoastUser(interaction, targetUserId) {
    // Check if target has opted out
    const targetOptedOut = await getUserOptOut(targetUserId);
    if (targetOptedOut) {
        return { 
            allowed: false, 
            reason: `${targetUserId} has opted out of being roasted` 
        };
    }
    
    // Prevent self-roasting
    if (targetUserId === interaction.user.id) {
        return { 
            allowed: false, 
            reason: "You can't roast yourself! That's my job." 
        };
    }
    
    return { allowed: true };
}

function containsInappropriateContent(text) {
    const bannedWords = [
        'racial slur', 
        'homophobic', 
        'transphobic', 
        'sexist', 
        'hate',
        'nigger',
        'faggot',
        'retard',
        'kike',
        'spic',
        'chink'
    ];
    
    const lowerText = text.toLowerCase();
    return bannedWords.some(word => lowerText.includes(word));
}

// Channel permission checking
async function canSendMessages(interaction, channel) {
    if (!channel) return false;
    
    const permissions = channel.permissionsFor(interaction.client.user);
    return permissions && permissions.has('SendMessages');
}

// Rate limiting functions
const cooldowns = new Map();

function setCooldown(userId, commandName, cooldownTime) {
    if (!cooldowns.has(commandName)) {
        cooldowns.set(commandName, new Map());
    }
    
    const now = Date.now();
    const timestamps = cooldowns.get(commandName);
    
    timestamps.set(userId, now + cooldownTime);
    
    setTimeout(() => timestamps.delete(userId), cooldownTime);
}

function getCooldownRemaining(userId, commandName) {
    if (!cooldowns.has(commandName)) return 0;
    
    const timestamps = cooldowns.get(commandName);
    const expirationTime = timestamps.get(userId);
    
    if (!expirationTime) return 0;
    
    const now = Date.now();
    const remaining = expirationTime - now;
    
    return remaining > 0 ? remaining : 0;
}

async function checkCooldown(interaction, commandName, cooldownTime) {
    const userId = interaction.user.id;
    const remaining = getCooldownRemaining(userId, commandName);
    
    if (remaining > 0) {
        const seconds = Math.ceil(remaining / 1000);
        await interaction.reply({
            content: `Please wait ${seconds} more second(s) before reusing the \`${commandName}\` command.`,
            ephemeral: true
        });
        return false;
    }
    
    setCooldown(userId, commandName, cooldownTime);
    return true;
}

module.exports = {
    saveCustomRoast,
    getCustomRoasts,
    setUserOptOut,
    getUserOptOut,
    
    hasAdminPermission,
    canRoastUser,
    
    containsInappropriateContent,
    
    canSendMessages,
    
    checkCooldown,
    setCooldown,
    getCooldownRemaining
};