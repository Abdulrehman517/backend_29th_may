import EntryTeam from '../models/entryTeam.js';

class EntryTeamController {
    constructor() {}

    static async list(req, res) {
        try {
            const results = await EntryTeam.listAll();
            let entryTeam = results.map((obj) => {
                const rate = obj.hourly_rate != null ? `$${obj.hourly_rate}` : '';
                return {
                    ...obj,
                    hourly_rate: rate,
                };
            });
            if (!Array.isArray(entryTeam) || !entryTeam.length) {
                return res.status(404).json({ message: 'No entry team member found' });
            }

            return res.json({ data: entryTeam });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async create(req, res) {
        try {
            const { first_name } = req.body;
            if (!first_name || first_name.trim() == '') {
                return res.status(400).json({ message: 'Entry Member Name is required' });
            }
            let existingUser = await EntryTeam.findOne(req.body.first_name.trim(), req.body.last_name.trim());
            if (existingUser) {
                return res.status(400).json({ message: 'Entry member with same first and last name already exists' });
            } else {
                const entryTeam = await EntryTeam.AddEntryTeams(req.body);
                return res.json({ message: 'success' });
            }
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const entryTeam = await EntryTeam.getEntryTeamById(req.params.id);
            if (!Array.isArray(entryTeam) || !entryTeam.length) {
                return res.status(404).json({ message: 'No entryTeam found' });
            }
            return res.json({ data: entryTeam[0] });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async updateById(req, res) {
        try {
            const { id, first_name } = req.body;
            if (!id || id == '' || !first_name || first_name == '') {
                return res.status(400).json({ message: 'Entry Member Name is required' });
            }
            let existingUser = await EntryTeam.findOne(req.body.first_name.trim(), req.body.last_name.trim());
            if (existingUser && existingUser.id !== id) {
                return res.status(400).json({ message: 'Entry member with same first and last name already exists' });
            } else {
                await EntryTeam.updateEntryTeamDetails(req.body);
                return res.json({ mesesage: 'success' });
            }
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async deleteById(req, res) {
        try {
            await EntryTeam.deleteEntryTeamDetails(req.params.id);
            return res.json({ mesesage: 'success' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async Historylist(req, res) {
        try {
            const history = await EntryTeam.listHistory(req.params.id, req.params.type);
            if (!Array.isArray(history) || !history.length) {
                return res.json({ message: 'No History found', data: [] });
            }
            return res.json({ data: history });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async getEntryTeamList(req, res, next) {
        try {
            const entryTeams = await EntryTeam.getEntryTeamListByEventId(req.params.id);
            if (!Array.isArray(entryTeams) || !entryTeams.length) {
                return res.status(404).json({ message: 'No entry team member found' });
            }

            return res.json({ data: entryTeams });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async addEntryTeamWithEvent(req, res, next) {
        try {
            const { entry_team_id, event_id } = req.body;
            const user_id = req.user.id;
            if (!entry_team_id || !event_id) {
                return res.status(400).json({ message: 'EntryTeam details are required' });
            } else {
                const entryTeam = await EntryTeam.addEntryTeamWithEvent(entry_team_id, event_id, user_id);
                return res.json({ data: entryTeam });
            }

        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}

export default EntryTeamController;
