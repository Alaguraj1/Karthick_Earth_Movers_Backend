const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for 587 (STARTTLS)
        auth: {
            user: process.env.SMTP_EMAIL, // Your Gmail address
            pass: process.env.SMTP_PASSWORD // App Password (NOT your real password)
        }
    });

    // 2. Define the email options
    const message = {
        from: `"${process.env.FROM_NAME || 'Karthick Earth Movers'}" <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html // Allows sending rich HTML emails
    };

    // 3. Send the email
    await transporter.sendMail(message);
};

module.exports = sendEmail;
