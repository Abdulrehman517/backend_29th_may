import ejs from 'ejs';
import settings from '../config/settings';
import path from 'path';
import nodemailer from 'nodemailer';

const getTransporter = () => {
    const transporter = nodemailer.createTransport({
        host: settings.smtpServer.host,
        port: settings.smtpServer.port,
        auth: {
            user: settings.smtpServer.user,
            pass: settings.smtpServer.pass,
        },
    });

    return transporter;
};

export const sendEmail = async ({ to, subject, templatePath, data = null }) => {
    const html = await ejs.renderFile(path.join(settings.templatesPath, templatePath), data);
    const mailOptions = {
        from: {
            name: settings.smtpServer.fromName,
            address: settings.smtpServer.fromAddress,
        },
        to: to,
        subject: subject,
        html: html,
    };
    try {
        const transporter = await getTransporter();
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.response}`);
        return true;
    } catch (err) {
        console.log(`Error sending email: ${err}`);
        return false;
    }
};
