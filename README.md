# Discord Riot 2FA Email Monitor

A Discord bot that automatically monitors your Gmail inbox for Riot Games 2FA codes and posts them directly to Discord.

## Features

- 🔍 Automatically monitors Gmail for Riot 2FA codes
- 📬 Posts codes to Discord channel in real-time
- 🔐 Secure IMAP connection to Gmail
- ⚡ Real-time notifications when codes arrive
- 🎮 Perfect for quick Riot Games logins

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

## Installation

1. Clone or download this project

2. Install dependencies:
```bash
npm install
```

3. Configure `config.json`:
```json
{
    "token": "YOUR_DISCORD_BOT_TOKEN",
    "clientId": "YOUR_BOT_CLIENT_ID",
    "guildId": "YOUR_GUILD_ID"
}
```

4. Deploy commands:
```bash
node deploy-commands.js
```

5. Start the bot:
```bash
node index.js
```

## Usage

### 1. Setup Email Monitoring

Run this command in Discord:
```
/setup-email
  email: your-email@gmail.com
  password: your-app-password
  channel: channel-id-for-codes
```

**To get Channel ID:**
- Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
- Right-click on the channel → Copy Channel ID

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
