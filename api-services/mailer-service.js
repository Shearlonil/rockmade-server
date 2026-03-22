const nodemailer = require("nodemailer");

const sendMail = async (email, subject, text) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_SERVICE_HOST,
        port: 465,
        secure: true, // Use true for port 465, false for all other ports
        auth: {
            user: process.env.MAIL_AUTH_USER,
            pass: process.env.MAIL_AUTH_USER_PASSWORD,
        },
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false,
        },
    });
    // Configure the mailoptions object
    const mailOptions = {
        from: process.env.MAIL_AUTH_USER,
        to: email,
        subject,
        text
    };
        
    // Send the email
    await transporter.sendMail(mailOptions);
}

module.exports = {
    sendMail,
};