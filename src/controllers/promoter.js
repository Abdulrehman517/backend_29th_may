import Promoter from '../models/promoter.js';

const table_guest_rate = 10;
const female_comp_guest_rate = 4;
const male_comp_guest_rate = 2;
class PromotersController {
    constructor() {}

    static async list(req, res, next) {
        try {
            const promoter = await Promoter.listAll();
            if (!Array.isArray(promoter) || !promoter.length) {
                return res.status(404).json({ message: 'No promoter member found' });
            }

            return res.json({ data: promoter });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async getPromoterList(req, res, next) {
        try {
            const promoter = await Promoter.getPromoterListByEventId(req.params.id);
            if (!Array.isArray(promoter) || !promoter.length) {
                return res.status(404).json({ message: 'No promoter member found' });
            }

            return res.json({ data: promoter });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async create(req, res, next) {
        try {
            const { promoter_member_name } = req.body;

            if (!promoter_member_name || promoter_member_name.trim() == '') {
                return res.status(400).json({ message: 'Promoter Name is required' });
            }
            let existingUser = await Promoter.findOne(req.body.promoter_member_name.trim());
            if (existingUser) {
                return res.status(400).json({ message: 'Promoter with same name already exists' });
            } else {
                const promoter = await Promoter.AddPromoter(req.body);
                return res.json({ message: 'success' });
            }
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async getById(req, res, next) {
        try {
            const promoter = await Promoter.getPromoterById(req.params.id);
            const schedule_dates = await Promoter.getPromoterSchedules(req.params.id);
            if (!Array.isArray(promoter) || !promoter.length) {
                return res.status(404).json({ message: 'No promoter found' });
            }
            let arrDates = [];
            for (let i in schedule_dates) {
                arrDates.push(schedule_dates[i]);
            }
            promoter[0].schedule_dates = arrDates;
            return res.json({ data: promoter[0] });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async updateById(req, res, next) {
        try {
            const { id, promoter_member_name } = req.body;
            if (!id || id == '' || !promoter_member_name || promoter_member_name == '') {
                return res.status(400).json({ message: 'Id and Promoter Name is required' });
            }
            let existingUser = await Promoter.findOne(req.body.promoter_member_name.trim());
            if (existingUser && existingUser.id !== id) {
                return res.status(400).json({ message: 'Promoter with same name already exists' });
            } else {
                await Promoter.updatePromoterDetails(req.body);
                return res.json({ mesesage: 'success' });
            }
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async deleteById(req, res, next) {
        try {
            await Promoter.deletePromoterDetails(req.params.id);
            return res.json({ mesesage: 'success' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async getEventsByPromoters(req, res, next) {
        try {
            console.log('list events by djs');
            console.log(req.params.id);
            const events = await Promoter.getEventsByPromoters(req.params.id);
            const updatedData = events.map((obj) => {
                const hasListedOrAttended =
                    obj.comp_listed !== null ||
                    obj.guest_attended !== null ||
                    obj.guest_listed !== null ||
                    obj.male_comp_guest_attended !== null ||
                    obj.female_comp_guest_attended !== null;
                return {
                    ...obj,
                    status: hasListedOrAttended,
                };
            });
            if (!Array.isArray(updatedData) || !updatedData.length) {
                return res.status(404).json({ message: 'No Event found For this Promoter' });
            }
            return res.json({ data: updatedData });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async eventPromotersData(req, res, next) {
        try {
            const eventsPromoters = await Promoter.getPromoterData();
            if (!Array.isArray(eventsPromoters) || !eventsPromoters.length) {
                return res.status(404).json({ message: 'No Promoter found associated to this event' });
            }
            return res.json({ data: eventsPromoters });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async addGuestHistory(req, res, next) {
        try {
            let total_earned = 0;
            const { promoter_id, event_id } = req.body;
            const user_id = req.user.id;
            if (!promoter_id || promoter_id == '' || !event_id || event_id == '') {
                return res.status(400).json({ message: 'History details are required' });
            }
            if (req.body.guest_attended || req.body.male_comp_attended || req.body.female_comp_attended) {
                total_earned =
                    table_guest_rate * req.body.guest_attended +
                    req.body.male_comp_attended * male_comp_guest_rate +
                    req.body.female_comp_attended * female_comp_guest_rate;
            }
            req.body.total_earned = total_earned;
            req.body.user_id = user_id;
            let result = await Promoter.addPromoterHistory(req.body);
            let avg_top_record = await Promoter.listTopHistory(req.body);
            return res.json({ message: 'Promoter Histroy Added successfully' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async Historylist(req, res, next) {
        try {
            const history = await Promoter.listHistory(req.params.id);
            if (!Array.isArray(history) || !history.length) {
                return res.json({ message: 'No History found', data: [] });
            }
            return res.json({ data: history });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async getPromoterEventsHistoryData(req, res, next) {
        try {
            const promoters = await Promoter.getPromoterEventsHistoryData();
            if (!Array.isArray(promoters) || !promoters.length) {
                return res.status(404).json({ message: 'No record found' });
            }
            return res.json({ data: promoters });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async PromoterEventHistorylist(req, res) {
        try {
            const history = await Promoter.PromoterEventListHistory(req.params.id, req.params.type);
            if (!Array.isArray(history) || !history.length) {
                return res.json({ message: 'No History found', data: [] });
            }
            return res.json({ data: history });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}

export default PromotersController;
