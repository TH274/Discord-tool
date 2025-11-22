const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');

class EmailService {
    constructor(config) {
        // Build TLS options based on config or environment variables.
        // Support `allowSelfSigned` in config or EMAIL_ALLOW_SELF_SIGNED=true in env.
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
    }

    /**
     * Fetch the latest 2FA code from Riot Games emails
     * @param {number} timeout - Maximum time to wait for email in milliseconds
     * @returns {Promise<string>} - The 2FA code
     */
    async fetch2FACode(timeout = 60000) {
        return new Promise((resolve, reject) => {
            const imap = new Imap(this.config);
            const startTime = Date.now();

            const checkForCode = () => {
                imap.once('ready', () => {
                    imap.openBox('INBOX', false, (err, box) => {
                        if (err) {
                            imap.end();
                            return reject(err);
                        }

                        // Search for emails from Riot Games in the last 5 minutes
                        const searchCriteria = [
                            'UNSEEN',
                            ['FROM', 'noreply@mail.accounts.riotgames.com'],
                            ['SINCE', new Date(Date.now() - 5 * 60 * 1000)]
                        ];

                        imap.search(searchCriteria, (err, results) => {
                            if (err) {
                                imap.end();
                                return reject(err);
                            }

                            if (!results || results.length === 0) {
                                imap.end();

                                // Check if timeout exceeded
                                if (Date.now() - startTime > timeout) {
                                    return reject(new Error('Timeout waiting for 2FA email'));
                                }

                                // Retry after 3 seconds
                                setTimeout(() => checkForCode(), 3000);
                                return;
                            }

                            // Fetch the most recent email
                            const f = imap.fetch(results.slice(-1), { bodies: '' });

                            f.on('message', (msg) => {
                                msg.on('body', (stream) => {
                                    simpleParser(stream, async (err, parsed) => {
                                        if (err) {
                                            imap.end();
                                            return reject(err);
                                        }

                                        // Extract 2FA code from email
                                        const code = this.extractCodeFromEmail(parsed.text || parsed.html);

                                        if (code) {
                                            imap.end();
                                            resolve(code);
                                        } else {
                                            imap.end();
                                            reject(new Error('Could not extract 2FA code from email'));
                                        }
                                    });
                                });
                            });

                            f.once('error', (err) => {
                                imap.end();
                                reject(err);
                            });

                            f.once('end', () => {
                                console.log('Done fetching email');
                            });
                        });
                    });
                });

                imap.once('error', (err) => {
                    reject(err);
                });

                imap.once('end', () => {
                    console.log('IMAP connection ended');
                });

                imap.connect();
            };

            checkForCode();
        });
    }

    /**
     * Extract 2FA code from email text
     * @param {string} text - Email body text
     * @returns {string|null} - The extracted code or null
     */
    extractCodeFromEmail(text) {
        if (!text) return null;

        // Riot Games typically sends codes in format: "Your code is: XXXXXX" or just "XXXXXX"
        // Try different patterns
        const patterns = [
            /(?:code is|verification code|code)[\s:]+([A-Z0-9]{6})/i,
            /\b([A-Z0-9]{6})\b/,
            /(?:code|pin)[\s:]+(\d{6})/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].toUpperCase();
            }
        }

        return null;
    }
}

module.exports = EmailService;
