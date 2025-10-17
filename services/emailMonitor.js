const Imap = require('imap');
const { simpleParser } = require('mailparser');
const EventEmitter = require('events');

class EmailMonitor extends EventEmitter {
    constructor(config) {
        super();
        this.config = {
            user: config.email,
            password: config.emailPassword,
            host: config.imapHost || 'imap.gmail.com',
            port: config.imapPort || 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        };
        this.imap = null;
        this.isMonitoring = false;
    }

    /**
     * Start monitoring inbox for new Riot 2FA codes
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.log('Already monitoring emails...');
            return;
        }

        this.isMonitoring = true;
        this.imap = new Imap(this.config);

        this.imap.once('ready', () => {
            console.log('Email monitor connected and ready');
            this.imap.openBox('INBOX', false, (err) => {
                if (err) {
                    console.error('Error opening inbox:', err);
                    this.emit('error', err);
                    return;
                }

                console.log('Monitoring inbox for Riot 2FA codes...');
                this.emit('monitoring', { status: 'active' });
            });
        });

        this.imap.on('mail', (numNewMsgs) => {
            console.log(`${numNewMsgs} new email(s) received`);
            this.checkForRiotCode();
        });

        this.imap.once('error', (err) => {
            console.error('IMAP Error:', err);
            this.emit('error', err);
            this.isMonitoring = false;
        });

        this.imap.once('end', () => {
            console.log('IMAP connection ended');
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
            console.log('Email monitoring stopped');
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
                    console.log('No new Riot emails found');
                    return;
                }

                console.log(`Found ${results.length} new Riot email(s)`);

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
                                console.log(`Found 2FA code: ${code}`);
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
