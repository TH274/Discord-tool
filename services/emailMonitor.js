const Imap = require('imap');
const { simpleParser } = require('mailparser');
const EventEmitter = require('events');
const fs = require('fs');

class EmailMonitor extends EventEmitter {
    constructor(config) {
        super();
        // Build TLS options based on config or environment variables.
        // You can set `allowSelfSigned` in the stored config (boolean) or
        // set EMAIL_ALLOW_SELF_SIGNED=true in the environment to allow
        // self-signed certificates (insecure: use only when necessary).
        const allowSelfSigned = (typeof config.allowSelfSigned !== 'undefined')
            ? !!config.allowSelfSigned
            : (process.env.RIOT_ALLOW_SELF_SIGNED === 'true');

        const tlsOptions = {};
        if (allowSelfSigned) {
            tlsOptions.rejectUnauthorized = false;
        }

    const caPath = config.caPath || process.env.RIOT_CA_PATH || null;
        if (caPath) {
            try {
                tlsOptions.ca = [fs.readFileSync(caPath)];
            } catch (e) {
                console.warn(`Could not read CA file at ${caPath}:`, e.message);
            }
        }

        this.config = {
            user: config.email,
            password: config.emailPassword,
            host: config.imapHost || 'imap.gmail.com',
            port: config.imapPort || 993,
            tls: true,
            tlsOptions
        };
        this.imap = null;
        this.isMonitoring = false;
    }

    /**
     * Start monitoring inbox for new Riot 2FA codes
     */
    startMonitoring() {
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;
        this.imap = new Imap(this.config);

        this.imap.once('ready', () => {
            this.imap.openBox('INBOX', false, (err) => {
                if (err) {
                    this.emit('error', err);
                    return;
                }

                this.emit('monitoring', { status: 'active' });
            });
        });

        this.imap.on('mail', (numNewMsgs) => {
            this.checkForRiotCode();
        });

        this.imap.once('error', (err) => {
            this.emit('error', err);
            this.isMonitoring = false;
        });

        this.imap.once('end', () => {
            this.isMonitoring = false;
            this.emit('disconnected');
        });

        this.imap.connect();
    }

    /**
     * Stop monitoring emails
     */
    stopMonitoring() {
        if (this.imap) {
            this.imap.end();
            this.isMonitoring = false;
        }
    }

    /**
     * Check inbox for new Riot 2FA codes
     */
    checkForRiotCode() {
        if (!this.imap) return;

        this.imap.openBox('INBOX', false, (err) => {
            if (err) {
                console.error('Error opening inbox:', err);
                return;
            }

            // Search for unseen emails from Riot Games
            const searchCriteria = [
                'UNSEEN',
                ['FROM', 'noreply@mail.accounts.riotgames.com']
            ];

            this.imap.search(searchCriteria, (err, results) => {
                if (err) {
                    console.error('Search error:', err);
                    return;
                }

                if (!results || results.length === 0) {
                    return;
                }

                // Fetch newest email(s)
                const f = this.imap.fetch(results.slice(-1), { bodies: '', markSeen: true });

                f.on('message', (msg) => {
                    msg.on('body', (stream) => {
                        simpleParser(stream, async (err, parsed) => {
                            if (err) {
                                console.error('Parse error:', err);
                                return;
                            }

                            // Extract 2FA code from email
                            const code = this.extractCodeFromEmail(parsed.text || parsed.html);

                            if (code) {
                                // Emit the code event — do not log sensitive codes to console
                                this.emit('codeFound', {
                                    code: code,
                                    subject: parsed.subject,
                                    from: parsed.from.text,
                                    date: parsed.date
                                });
                            }
                        });
                    });
                });

                f.once('error', (err) => {
                    console.error('Fetch error:', err);
                });
            });
        });
    }

    /**
     * Extract 2FA code from email text
     * @param {string} text - Email body text
     * @returns {string|null} - The extracted code or null
     */
    extractCodeFromEmail(text) {
        if (!text) return null;

        // Remove HTML tags if present
        text = text.replace(/<[^>]*>/g, ' ');

        // Riot Games typically sends codes in various formats
        const patterns = [
            /(?:code is|verification code|code|pin)[\s:]+([A-Z0-9]{6})/i,
            /\b([A-Z0-9]{6})\b/,
            /(?:code|pin)[\s:]+(\d{6})/i,
            /Your\s+(?:verification\s+)?code:\s*([A-Z0-9]{6})/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const code = match[1].toUpperCase();
                // Validate it's actually a code (6 alphanumeric characters)
                if (/^[A-Z0-9]{6}$/.test(code)) {
                    return code;
                }
            }
        }

        return null;
    }
}

module.exports = EmailMonitor;
