import Emails from '../models/email.js';

class EmailController {
    constructor() {}

    static async create(req, res, next) {
        try {
            const emails = await Emails.createContent(req.body);
            return res.json({ data: emails });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }
    static async getByType(req, res, next) {
        try {
            const emailContent = await Emails.getEmailConent(req.params.type);
            if (!Array.isArray(emailContent) || !emailContent.length) {
                return res.status(404).json({ message: 'Email content Not found' });
            }
            return res.json({ data: emailContent[0] });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async getEmailLogsByDj(req, res, next) {
        try {
            const emailLogs = await Emails.getEmailLogsByDj(req.params.id);
            if (!Array.isArray(emailLogs) || !emailLogs.length) {
                return res.status(404).json({ message: 'Email Logs Not found' });
            }
            return res.json({ data: emailLogs[0] });

        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}

export default EmailController;
