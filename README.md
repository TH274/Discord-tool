# Discord Riot 2FA Email Monitor

A Discord bot that automatically monitors your Gmail inbox for Riot Games 2FA codes and posts them directly to Discord.

## Features

- 🔍 Automatically monitors Gmail for Riot 2FA codes
- 📬 Posts codes to Discord channel in real-time
- 🔐 Secure IMAP connection to Gmail
- ⚡ Real-time notifications when codes arrive
- 🎮 Perfect for quick Riot Games logins
- ☁️ Easy deployment to Render.com or other cloud platforms

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Gmail App Password** (not your regular Gmail password)
3. **Discord Bot Token**

## Gmail Setup

### Enable Gmail App Passwords

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Scroll down to **App passwords**
4. Create a new app password:
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Name it: "Discord Bot" or similar
5. Copy the 16-character password (remove spaces)

**Important:** Use this App Password in the bot, NOT your regular Gmail password!

## Installation (Local Development)

1. Clone or download this project

2. Install dependencies:
```bash
npm install
```

3. Create `config.json` from the example:
```bash
cp config.example.json config.json
```

4. Edit `config.json` with your credentials:
```json
{
    "token": "YOUR_DISCORD_BOT_TOKEN",
    "clientId": "YOUR_BOT_CLIENT_ID",
    "guildId": "YOUR_GUILD_ID",
    "riot": {
        "email": "your-email@gmail.com",
        "emailPassword": "your-gmail-app-password",
        "channelId": "YOUR_CHANNEL_ID",
        "imapHost": "imap.gmail.com",
        "imapPort": 993
    }
}
```

5. Deploy commands:
```bash
node deploy-commands.js
```

6. Start the bot:
```bash
node index.js
```

## Deployment to Render.com

### Step 1: Prepare Your Repository

1. Push your code to GitHub (make sure `config.json` is in `.gitignore`)
2. Only commit `config.example.json`, not `config.json`

### Step 2: Create Render Service

1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `discord-riot-bot` (or your choice)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free (or paid for better uptime)

### Step 3: Set Environment Variables

In the Render.com dashboard, add these environment variables:

| Variable | Value | Example |
|----------|-------|---------|
| `DISCORD_TOKEN` | Your Discord bot token | `MTQyODIxNz...` |
| `DISCORD_CLIENT_ID` | Your bot's client ID | `1428217426104942602` |
| `DISCORD_GUILD_ID` | Your Discord server ID | `749253588253147147` |
| `RIOT_EMAIL` | Your Gmail address | `your-email@gmail.com` |
| `RIOT_EMAIL_PASSWORD` | Gmail App Password | `abcd efgh ijkl mnop` |
| `RIOT_CHANNEL_ID` | Discord channel ID | `1428291240092504075` |
| `RIOT_IMAP_HOST` | IMAP server (optional) | `imap.gmail.com` |
| `RIOT_IMAP_PORT` | IMAP port (optional) | `993` |

### Step 4: Deploy Commands

1. After the first deployment completes, go to your service's Shell tab
2. Run: `node deploy-commands.js`
3. This registers the slash commands with Discord

### Step 5: Done!

Your bot should now be online and ready to use!

## Environment Variables

The bot supports both `config.json` (for local development) and environment variables (for production).

**Priority:** Environment variables override `config.json` values.

### Required:
- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `RIOT_EMAIL`
- `RIOT_EMAIL_PASSWORD`
- `RIOT_CHANNEL_ID`

### Optional:
- `DISCORD_GUILD_ID` (for guild-specific commands)
- `RIOT_IMAP_HOST` (defaults to `imap.gmail.com`)
- `RIOT_IMAP_PORT` (defaults to `993`)

## Usage

### 1. Setup Email Monitoring

Run this command in Discord:
```
/setup-email
  email: your-email@gmail.com
  password: your-app-password
  channel: #channel-name
```

**Note:** Simply select or mention the channel from the dropdown - no need to find the channel ID!

### 2. Start Monitoring

```
/start-monitor
```

The bot will now monitor your Gmail and automatically post any Riot 2FA codes to the configured channel.

### 3. Stop Monitoring

```
/stop-monitor
```

Stops monitoring your Gmail inbox.

## How It Works

1. Bot connects to your Gmail via IMAP
2. Monitors inbox for new emails from `noreply@mail.accounts.riotgames.com`
3. Extracts 6-digit 2FA code from email body
4. Posts the code to your configured Discord channel with timestamp and details

## Commands

| Command | Description |
|---------|-------------|
| `/setup-email` | Configure your Gmail credentials and target channel |
| `/start-monitor` | Start monitoring Gmail for Riot 2FA codes |
| `/stop-monitor` | Stop monitoring Gmail |
| `/ping` | Check bot latency |
| `/user` | Get user information |

## Security Notes

- ⚠️ Never share your `config.json` file - it contains sensitive tokens
- 🔒 Always use Gmail App Passwords, not your main password
- 🛡️ The bot has access to your email - only run it in trusted environments
- 📝 Add `config.json` to `.gitignore` if using version control

## Troubleshooting

### "Authentication failed" error
- Make sure you're using a Gmail App Password, not your regular password
- Verify 2-Step Verification is enabled on your Google Account
- Check that IMAP is enabled in Gmail settings

### "No new emails found"
- Check that emails are from `noreply@mail.accounts.riotgames.com`
- Make sure the email isn't already marked as "read"
- Try manually checking your inbox for the email

### Bot doesn't post codes
- Verify the channel ID is correct
- Check bot has permissions to send messages in that channel
- Look at console logs for error messages

## File Structure

```
discord-tool/
├── commands/
│   ├── riot/
│   │   ├── setup-email.js    # Email configuration command
│   │   ├── start-monitor.js  # Start monitoring command
│   │   └── stop-monitor.js   # Stop monitoring command
│   └── utility/
│       ├── ping.js
│       └── user.js
├── events/
│   └── interactionCreate.js
├── services/
│   ├── emailMonitor.js       # Email monitoring service
│   └── emailService.js       # Basic email utilities
├── config.json               # Bot configuration
├── deploy-commands.js        # Command deployment
└── index.js                  # Main bot file
```

## Dependencies

- `discord.js` - Discord API wrapper
- `imap` - IMAP client for Gmail
- `mailparser` - Parse email content
- `axios` - HTTP client

## License

ISC

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all credentials are correct
3. Ensure Gmail App Password is properly generated
4. Check bot permissions in Discord
