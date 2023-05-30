import Users from '../models/user.js';
import Cryptr from 'cryptr';

class UserController {
    constructor() {}

    static async list(req, res, next) {
        try {
            const user = await Users.listAll();
            if (!Array.isArray(user) || !user.length) {
                return res.status(404).json({ message: 'No DJs found', data: [] });
            }

            return res.json({ data: user });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }

    static async create(req, res, next) {
        try {
            const { user_name, password } = req.body;

            if (!user_name || user_name.trim() == '' || !password || password == '') {
                return res.status(400).json({ message: 'User details are required' });
            }
            let existingUser = await Users.findOne(req.body.user_name.trim());
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            } else {
                await Users.Addusers(req.body);
                return res.status(200).json({ message: 'success' });
            }
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }

    static async getById(req, res, next) {
        try {
            const user = await Users.getById(req.params.id);

            console.log(user);

            if (!Array.isArray(user) || !user.length) {
                return res.status(404).json({ message: 'No DJs found', data: [] });
            }

            const cryptr = new Cryptr('secret', { pbkdf2Iterations: 10000, saltLength: 5 });
            const decryptedString = cryptr.decrypt(user[0].password_display);

            user[0].password_display = decryptedString;

            return res.json({ data: user });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }

    static async deleteById(req, res, next) {
        try {
            await Users.deleteById(req.params.id);
            return res.json({ mesesage: 'success' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async updateById(req, res, next) {
        try {
            const { user_name, password_display, id } = req.body;
            if (!user_name || user_name == '' || !password_display || password_display == '') {
                return res.status(400).json({ message: 'User details are required' });
            }
            let existingUser = await Users.findOne(req.body.user_name.trim());
            if (existingUser && existingUser.id != id) {
                return res.status(400).json({ message: 'User already exists' });
            } else {
                await Users.updateUserById(req.body);
                return res.json({ mesesage: 'success' });
            }
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }
}

export default UserController;
