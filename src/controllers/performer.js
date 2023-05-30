import Performer from '../models/performer';
import creds from '../config/cred.json';
import { GoogleSpreadsheet } from 'google-spreadsheet';

class PerformersController {
    constructor() {}

    static async list(req, res, next) {
        try {
            const performers = await Performer.listAll();
            if (!Array.isArray(performers) || !performers.length) {
                return res.status(404).json({ message: 'No performer member found' });
            }
            for (let i in performers) {
                if (performers[i].title != null) {
                    performers[i].Affiliations = performers[i].title.split('!%');
                } else {
                    performers[i].Affiliations = [];
                }
            }

            return res.json({ data: performers });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async create(req, res, next) {
        try {
            const { performer_member_name } = req.body;

            if (!performer_member_name || performer_member_name.trim() == '') {
                return res.status(400).json({ message: 'Performer details are required' });
            }
            let existingUser = await Performer.findOne(req.body.performer_member_name.trim());
            if (existingUser) {
                return res.status(400).json({ message: 'Performer with same name already exists' });
            } else {
                const performer = await Performer.AddPerformer(req.body);
                return res.json({ message: 'success' });
            }
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async getById(req, res, next) {
        try {
            const performers = await Performer.getPerformerById(req.params.id);
            const schedule_dates = await Performer.getPerformerSchedules(req.params.id);
            if (!Array.isArray(performers) || !performers.length) {
                return res.status(404).json({ message: 'No performer found' });
            }
            let arrDates = [];
            for (let i in schedule_dates) {
                arrDates.push(schedule_dates[i]);
            }
            let aff = performers[0].title != null ? performers[0].title.split('!%') : [];
            const formattedArr = aff.map((affiliation) => {
                return { affiliation };
            });
            performers[0].Affiliations = formattedArr;
            performers[0].schedule_dates = arrDates;
            return res.json({ data: performers[0] });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async updateById(req, res, next) {
        try {
            const { id, performer_member_name } = req.body;

            if (!id || id == '' || !performer_member_name || performer_member_name == '') {
                return res.status(400).json({ message: 'Performer details are required' });
            }
            let existingUser = await Performer.findOne(req.body.performer_member_name.trim());
            if (existingUser && existingUser.id !== id) {
                return res.status(400).json({ message: 'Performer with same name already exists' });
            } else {
                await Performer.updatePerformerDetails(req.body);
                return res.json({ mesesage: 'success' });
            }
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async eventPerformerUpdate(req, res, next) {
        try {
            let user_id = req.user.id;
            req.body.user_id = user_id;
            await Performer.updateBy(req.body);
            return res.json({ message: 'Performer Updated successfully' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async deleteById(req, res, next) {
        try {
            await Performer.deletePerformerDetails(req.params.id);
            return res.json({ mesesage: 'success' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async PerformerEventHistorylist(req, res) {
        try {
            const history = await Performer.PerformerEventListHistory(req.params.id, req.params.type);
            if (!Array.isArray(history) || !history.length) {
                return res.json({ message: 'No History found', data: [] });
            }
            return res.json({ data: history });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async getPerformerList(req, res, next) {
        try {
            const performers = await Performer.getPerformerListByEventId(req.params.id);
            if (!Array.isArray(performers) || !performers.length) {
                return res.status(404).json({ message: 'No performer member found' });
            }

            return res.json({ data: performers });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async addPerformerWithEvent(req, res, next) {
        try {
            const { performer_id, event_id, set_rate } = req.body;
            const user_id = req.user.id;
            if (!performer_id || !event_id) {
                return res.status(400).json({ message: 'Performer details are required' });
            } else {
                const performer = await Performer.addPerformerWithEvent(performer_id, event_id, set_rate, user_id);
                return res.json({ data: performer });
            }

        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}

export default PerformersController;
