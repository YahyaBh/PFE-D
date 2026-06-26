const nodemailer = require('nodemailer');

let transporter = null;
let transporterReady = false;

async function initTransporter() {
    if (transporterReady) return transporter;

    if (process.env.SMTP_USER) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        console.log('[EMAIL] Using configured SMTP:', process.env.SMTP_HOST);
    } else {
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log('[EMAIL] No SMTP configured — auto-created Ethereal test account:', testAccount.user);
            console.log('[EMAIL] Preview URL available after each send at:', 'https://ethereal.email/login');
        } catch (err) {
            console.warn('[EMAIL] Could not create Ethereal account, falling back to console logging:', err.message);
            transporter = null;
        }
    }

    transporterReady = true;
    return transporter;
}

const MarjaneBranding = `
    <div style="background-color: #0d1b2a; color: #ffffff; padding: 20px; font-family: sans-serif; border-radius: 12px;">
        <div style="text-align: center; border-bottom: 2px solid #e0c56e; padding-bottom: 20px; margin-bottom: 20px;">
            <h1 style="color: #e0c56e; margin: 0;">Marjane Wallet</h1>
            <p style="font-size: 0.8rem; opacity: 0.8; margin-top: 5px;">Your Secure Digital Banking Partner</p>
        </div>
`;

const MarjaneFooter = `
    <div style="text-align: center; font-size: 0.7rem; opacity: 0.5; margin-top: 20px;">
        &copy; Marjane Fintech Group. All rights reserved.
    </div>
`;

async function sendOrLog({ to, subject, html }) {
    await initTransporter();
    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: '"Marjane Wallet" <noreply@marjane.ma>',
                to,
                subject,
                html,
            });
            if (info.messageId && !process.env.SMTP_USER) {
                console.log('[EMAIL] Preview URL:', nodemailer.getTestMessageUrl(info));
            }
            return info;
        } catch (err) {
            console.warn('[EMAIL] Send failed, falling back to console log:', err.message);
        }
    }
    console.log(`[EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
}

const emailService = {
    async sendMFACode(email, code) {
        const html = `
            ${MarjaneBranding}
            <div style="padding: 20px;">
                <h2 style="color: #ffffff;">Login Verification Code</h2>
                <p>Hello,</p>
                <p>Use the following code to complete your login to Marjane Wallet. This code expires in 15 minutes.</p>
                <div style="background-color: #1b263b; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 2.5rem; font-weight: bold; letter-spacing: 5px; color: #e0c56e;">${code}</span>
                </div>
                <p style="font-size: 0.9rem; color: #ff4d4d;">If you did not attempt to log in, please secure your account immediately.</p>
            </div>
            ${MarjaneFooter}
        `;
        return sendOrLog({ to: email, subject: 'Verification Code - Marjane Wallet', html });
    },

    async sendTransactionAlert(email, amount, type, receiver) {
        const html = `
            ${MarjaneBranding}
            <div style="padding: 20px;">
                <h2 style="color: #4CAF50;">Transaction Successful</h2>
                <p>You have successfully completed a ${type.toLowerCase()}.</p>
                <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #1b263b;">Amount:</td><td style="padding: 8px; border-bottom: 1px solid #1b263b; font-weight: bold;">${amount} MAD</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #1b263b;">Recipient:</td><td style="padding: 8px; border-bottom: 1px solid #1b263b; font-weight: bold;">${receiver}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #1b263b;">Date:</td><td style="padding: 8px; border-bottom: 1px solid #1b263b;">${new Date().toLocaleString()}</td></tr>
                </table>
                <p style="margin-top: 20px; font-size: 0.9rem;">Thank you for choosing Marjane Wallet.</p>
            </div>
            ${MarjaneFooter}
        `;
        return sendOrLog({ to: email, subject: 'Transaction Alert - Marjane Wallet', html });
    },

    async sendPasswordResetEmail(email, resetToken) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
        const html = `
            ${MarjaneBranding}
            <div style="padding: 20px;">
                <h2 style="color: #e0c56e;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>We received a request to reset your Marjane Wallet password. Click the button below to set a new password. This link expires in 1 hour.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #e0c56e; color: #0d1b2a; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1.1rem; display: inline-block;">Reset Password</a>
                </div>
                <p style="font-size: 0.9rem; color: #ff4d4d;">If you did not request this, please ignore this email or contact support.</p>
            </div>
            ${MarjaneFooter}
        `;
        return sendOrLog({ to: email, subject: 'Password Reset - Marjane Wallet', html });
    },

    async sendGenericEmail({ to, subject, title, bodyHtml }) {
        const html = `
            ${MarjaneBranding}
            <div style="padding: 20px;">
                ${title ? `<h2 style="color: #e0c56e;">${title}</h2>` : ''}
                ${bodyHtml}
            </div>
            ${MarjaneFooter}
        `;
        return sendOrLog({ to, subject, html });
    }
};

module.exports = emailService;
