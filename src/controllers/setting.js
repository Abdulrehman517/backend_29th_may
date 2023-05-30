import Seetings from '../models/setting.js';

class SettingsController {
    constructor() {}

    static async list(req, res, next) {
        try {
            const feelist = await Seetings.listAll();
            if (!Array.isArray(feelist) || !feelist.length) {
                return res.json({ message: 'No Fee found', data: [] });
            }

            return res.json({ data: feelist });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async createFee(req, res, next) {
        try {
            const { fee } = req.body;
            if (!fee || fee == '') {
                return res.status(400).json({ message: 'Fee is required' });
            }

            const djs = await Seetings.Addfee(req.body);
            return res.json({ message: 'success' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async createUser(req, res, next) {
        try {
            const { user } = req.body;
            if (!user || user.trim() == '') {
                return res.status(400).json({ message: 'User is required' });
            }
            let existingUser = await Seetings.findOne(req.body.user.trim());
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            } else {
                const djs = await Seetings.Adduser(req.body);
                return res.json({ message: 'success' });
            }
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async listUser(req, res, next) {
        try {
            const Userlist = await Seetings.listAllUsers();
            if (!Array.isArray(Userlist) || !Userlist.length) {
                return res.json({ message: 'No Fee found', data: [] });
            }
            return res.json({ data: Userlist });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async DeleteFeeById(req, res, next) {
        try {
            await Seetings.deleteFeeDetails(req.params.id);
            return res.json({ message: 'Fee details deleted successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: error.message });
        }
    }

    static async DeleteUserByName(req, res, next) {
        try {
            await Seetings.deleteUserDetails(req.params.username);
            return res.json({ message: 'User details deleted successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: error.message });
        }
    }

    static async getUserStats(req, res, next) {
        try {
            const UserStats = await Seetings.getUsersStats();
            if (!Array.isArray(UserStats) || !UserStats.length) {
                return res.json({ message: 'No Stats found', data: [] });
            }
            return res.json({ data: UserStats });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async getSuggestedFee(req, res, next) {
        try {
            const suggestedFee = await Seetings.getSuggestedFee(req.params.id);
            if (!Array.isArray(suggestedFee) || !suggestedFee.length || suggestedFee.length == 0) {
                return res.json({ message: 'No Suggested Fee found', data: [] });
            }
            return res.json({ data: suggestedFee[0] });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

}

export default SettingsController;
