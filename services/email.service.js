const nodemailer = require('nodemailer');

/**
 * Email Service for sending OTPs.
 */

// Configuration - User will need to provide their own SMTP settings
const EMAIL_CONF = {
    ENABLED: process.env.EMAIL_ENABLED === 'true',
    HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    PORT: process.env.EMAIL_PORT || 587,
    USER: process.env.EMAIL_USER || '',
    PASS: process.env.EMAIL_PASS || '',
    FROM: process.env.EMAIL_FROM || '"STS System" <noreply@sts-app.com>'
};

/**
 * Sends an OTP via Email.
 */
async function sendOTP(email, code) {
    if (!EMAIL_CONF.ENABLED || !EMAIL_CONF.USER) {
        console.log('--------------------------------------------------');
        console.log(`[SIMULATED EMAIL] To: ${email}`);
        console.log(`[SUBJECT]: รหัส OTP สำหรับเข้าใช้งานระบบ STS`);
        console.log(`[BODY]: รหัส OTP ของคุณคือ: ${code}`);
        console.log('--------------------------------------------------');
        return { success: true, provider: 'SIMULATOR' };
    }

    const transporter = nodemailer.createTransport({
        host: EMAIL_CONF.HOST,
        port: EMAIL_CONF.PORT,
        secure: EMAIL_CONF.PORT === 465,
        auth: {
            user: EMAIL_CONF.USER,
            pass: EMAIL_CONF.PASS
        }
    });

    try {
        await transporter.sendMail({
            from: EMAIL_CONF.FROM,
            to: email,
            subject: 'รหัส OTP สำหรับเข้าใช้งานระบบ STS',
            text: `รหัส OTP สำหรับเข้าใช้งานระบบของคุณคือ: ${code}\n\nรหัสนี้จะหมดอายุภายใน 5 นาที`,
            html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                     <h2 style="color: #1e40af;">ยืนยันตัวตนระบบ STS</h2>
                     <p>รหัส OTP สำหรับเข้าใช้งานของคุณคือ:</p>
                     <div style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px; margin: 20px 0;">${code}</div>
                     <p style="color: #64748b; font-size: 14px;">รหัสนี้จะหมดอายุภายใน 5 นาที</p>
                   </div>`
        });
        return { success: true, provider: 'SMTP' };
    } catch (err) {
        console.error('Email Error:', err.message);
        throw err;
    }
}

module.exports = {
    sendOTP
};
