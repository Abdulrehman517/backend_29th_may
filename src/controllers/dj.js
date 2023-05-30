import Djs from '../models/dj.js';
import creds from '../config/cred.json';
import { GoogleSpreadsheet } from 'google-spreadsheet';

class DjsController {
    constructor() {}

    static async list(req, res, next) {
        try {
            const djs = await Djs.listAll();
            if (!Array.isArray(djs) || !djs.length) {
                return res.status(404).json({ message: 'No DJs found' });
            }

            for (let i in djs) {
                if (djs[i] && djs[i].date_of_birth && djs[i].date_of_birth.toISOString().includes('1899')) {
                    djs[i].date_of_birth = null;
                }

                if (djs[i].title != null) {
                    djs[i].Affiliations = djs[i].title.split('!%');
                } else {
                    djs[i].Affiliations = [];
                }
            }

            return res.json({ data: djs });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }

    static async listRankwise(req, res, next) {
        try {
            const djs = await Djs.listRankwise();
            if (!Array.isArray(djs) || !djs.length) {
                return res.status(404).json({ message: 'No DJs found' });
            }

            const djlist = [];

            for (let i = 0; i < djs.length; i++) {
                djs[i].incremental_num = i + 1;
                djlist.push(djs[i]);
                if ((i + 1) % 10 === 0) {
                    const totalIsSum = djlist.slice(i - 9, i + 1).reduce((sum, obj) => sum + parseInt(obj.total_is), 0);
                    const totalInSum = djlist.slice(i - 9, i + 1).reduce((sum, obj) => sum + parseInt(obj.total_in), 0);
                    const averageTotalIs = totalIsSum / 10;
                    const averageTotalIn = totalInSum / 10;
                    i == 9 && djs[i].total_in != null && djs[i].total_is != 0
                        ? (djs[i].rating = 1)
                        : i == 19 && djs[i].total_in != null && djs[i].total_is != 0
                        ? (djs[i].rating = 2)
                        : i == 29 && djs[i].total_in != null && djs[i].total_is != 0
                        ? (djs[i].rating = 3)
                        : djs[i].total_in != null && djs[i].total_is != 0
                        ? (djs[i].rating = 3)
                        : (djs[i].rating = null);
                    djlist.push({
                        incremental_num: '',
                        id: '',
                        dj_name: '',
                        first_name: '',
                        last_name: '',
                        gender: '',
                        instagram_url: '',
                        guest_list_url: '',
                        create_time: '',
                        update_time: '',
                        payment_method: '',
                        rating: 'Avg',
                        total_is: averageTotalIs.toFixed(1),
                        total_in: averageTotalIn.toFixed(1),
                        conversion_rate: null,
                        notes: '',
                        date_of_birth: '',
                        phone: '',
                        email: '',
                        lead_by: '',
                        active_status: null,
                        title: null,
                    });
                } else if (i < 10 && djs[i].total_in != null && djs[i].total_is != 0) {
                    djs[i].rating = 1;
                } else if (i < 20 && djs[i].total_in != null && djs[i].total_is != 0) {
                    djs[i].rating = 2;
                } else if (i < 30 && djs[i].total_in != null && djs[i].total_is != 0) {
                    djs[i].rating = 3;
                } else if (i >= 30 && djs[i].total_in != null && djs[i].total_is != 0) {
                    djs[i].rating = 3;
                }
            }

            // check if there are any remaining records
            if (djlist.length % 10 !== 0) {
                const remainingRecords = djlist.slice(djlist.length - (djlist.length % 10));
                const totalIsSum = remainingRecords.reduce((sum, obj) => sum + parseInt(obj.total_is), 0);
                const totalInSum = remainingRecords.reduce((sum, obj) => sum + parseInt(obj.total_in), 0);
                const averageTotalIs = totalIsSum / remainingRecords.length;
                const averageTotalIn = totalInSum / remainingRecords.length;
                djlist.push({
                    incremental_num: '',
                    id: '',
                    dj_name: '',
                    first_name: '',
                    last_name: '',
                    gender: '',
                    instagram_url: '',
                    guest_list_url: '',
                    create_time: '',
                    update_time: '',
                    payment_method: '',
                    rating: 'Avg',
                    total_is: averageTotalIs.toFixed(1),
                    total_in: averageTotalIn.toFixed(1),
                    conversion_rate: null,
                    notes: '',
                    date_of_birth: '',
                    phone: '',
                    email: '',
                    lead_by: '',
                    active_status: null,
                    title: null,
                });
            }

            return res.json({ data: djlist });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }

    static async listDeactivated(req, res, next) {
        try {
            const djs = await Djs.listDeActivated();
            if (!Array.isArray(djs) || !djs.length) {
                return res.status(404).json({ message: 'No DJs found' });
            }

            for (let i in djs) {
                if (djs[i].title != null) {
                    djs[i].Affiliations = djs[i].title.split('!%');
                } else {
                    djs[i].Affiliations = [];
                }
            }

            return res.json({ data: djs });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async create(req, res, next) {
        try {
            const { dj_name } = req.body;
            if (!dj_name || dj_name.trim() == '') {
                return res.status(400).json({ message: 'Dj Name is required' });
            }

            if (req.body.guest_list_url != undefined && req.body.guest_list_url != '') {
                let capturedId = req.body.guest_list_url.match(/\/d\/(.+)\//);
                capturedId = capturedId[1];
                const doc = new GoogleSpreadsheet(capturedId);
                await doc.useServiceAccountAuth(creds);
                await doc.loadInfo();
                let latest_event_index = doc.sheetsByIndex.length - 1;
                const worksheet = doc.sheetsByIndex[latest_event_index];
                const rows = await worksheet.getRows();
                let total_is = 0;
                let total_in = 0;
                let add_stats = false;
                rows.forEach((row) => {
                    total_is++;
                    if (row.Attended != undefined) {
                        add_stats = true;
                    }
                    if (row.Attended != undefined) {
                        total_in++;
                    }
                });
                if (add_stats) {
                    req.body.total_is = total_is;
                    req.body.total_in = total_in;
                    let conversion_rate = (total_in / total_is) * 100;
                    req.body.conversion_rate = conversion_rate.toFixed(1);
                }
            }
            let existingUser = await Djs.findOne(req.body.dj_name.trim());
            if (existingUser) {
                return res.status(400).json({ message: 'DJ with same name already exists' });
            } else {
                const djs = await Djs.AddDjs(req.body);
                return res.json({ message: 'success' });
            }
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async getById(req, res, next) {
        try {
            const djs = await Djs.getDjById(req.params.id);
            const schedule_dates = await Djs.getDjSchedules(req.params.id);
            if (!Array.isArray(djs) || !djs.length) {
                return res.status(404).json({ message: 'No DJs found' });
            }

            if (djs[0] && djs[0].date_of_birth && djs[0].date_of_birth.toISOString().includes('1899')) {
                djs[0].date_of_birth = null;
            }

            let aff = djs[0].title != null ? djs[0].title.split('!%') : [];
            const formattedArr = aff.map((affiliation) => {
                return { affiliation };
            });
            let arrDates = [];
            for (let i in schedule_dates) {
                arrDates.push(schedule_dates[i]);
            }
            djs[0].Affiliations = formattedArr;
            djs[0].schedule_dates = arrDates;
            return res.json({ data: djs[0] });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async updateById(req, res, next) {
        try {
            let existingUser = await Djs.findOne(req.body.dj_name.trim());
            if (existingUser && existingUser.id !== req.body.id) {
                return res.status(400).json({ message: 'DJ with same name already exists' });
            } else {
                await Djs.updatedjDetails(req.body);
                return res.json({ mesesage: 'success' });
            }
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async deleteById(req, res, next) {
        try {
            await Djs.deletedjDetails(req.params.id);
            return res.json({ mesesage: 'success' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async historyList(req, res, next) {
        try {
            const history = await Djs.listHistory(req.params.id, req.params.type);
            if (!Array.isArray(history) || !history.length) {
                return res.json({ message: 'No History found', data: [] });
            }
            return res.json({ data: history });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async updateFee(req, res, next) {
        try {
            let user_id = req.user.id;
            req.body.user_id = user_id;
            await Djs.updateFee(req.body);
            return res.json({ message: 'Fee Updated successfully' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async updateBy(req, res, next) {
        try {
            let user_id = req.user.id;
            req.body.user_id = user_id;
            await Djs.updateBy(req.body);
            return res.json({ message: 'Dj Lead Updated successfully' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async updateNotes(req, res, next) {
        try {
            let user_id = req.user.id;
            req.body.user_id = user_id;
            await Djs.updateNotes(req.body);
            return res.json({ message: 'Dj Notes Updated successfully' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async addGuestHistory(req, res, next) {
        try {
            let result = await Djs.addDjHistory(req.body);
            let avg_top_record = await Djs.listTopHistory(req.body.dj_id);
            DjsController.rankDjs(avg_top_record, req.body.dj_id);
            return res.json({ message: 'DJ Histroy Added successfully' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async activateDj(req, res, next) {
        try {
            await Djs.activateDj(req.params.id);
            return res.json({ message: 'DJ activated successfully' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async rankDjs(avg_top_record, dj_id) {
        try {
            if (avg_top_record.length > 0) {
                let rank = null;
                if (avg_top_record[0].avg_listed >= 90) {
                    rank = 1;
                } else if (
                    avg_top_record[0].avg_listed < 90 &&
                    (avg_top_record[0].avg_listed >= 50) & (avg_top_record[0].avg_conversion_rate >= 50)
                ) {
                    rank = 1;
                } else if (
                    avg_top_record[0].avg_listed < 90 &&
                    (avg_top_record[0].avg_listed >= 50) & (avg_top_record[0].avg_conversion_rate >= 15)
                ) {
                    rank = 2;
                } else if (
                    avg_top_record[0].avg_listed > 20 &&
                    (avg_top_record[0].avg_listed <= 50) & (avg_top_record[0].avg_conversion_rate >= 50)
                ) {
                    rank = 2;
                } else if (avg_top_record[0].avg_listed < 20) {
                    rank = 3;
                } else if (
                    avg_top_record[0].avg_listed > 20 &&
                    (avg_top_record[0].avg_listed <= 50) & (avg_top_record[0].avg_conversion_rate <= 50)
                ) {
                    rank = 3;
                } else {
                    console.log(avg_top_record);
                }
                await Djs.updateRank(rank, dj_id);
            }
        } catch (error) {
            console.error(error);
            // return res.status(400).json({ message: error.message });
        }
    }

    static async listRecommended(req, res, next) {
        try {
            const recommended = await Djs.listRecommended(req.params.venue_id, req.params.event_date);

            if (!Array.isArray(recommended) || !recommended.length) {
                return res.json({ message: 'No History found', data: [] });
            }

            const filteredArr = recommended.filter((event) => event.dj_name && event.dj_name.trim() !== '');
            // separate events based on conditions
            const greaterThanOrEqual60 = filteredArr.filter((event) => event.days_since_last_event >= 60);
            const greaterThan30AndLessThan60 = filteredArr.filter(
                (event) => event.days_since_last_event > 0 && event.days_since_last_event < 60
            );

            return res.json({ recommended_one: greaterThanOrEqual60, recommended_two: greaterThan30AndLessThan60 });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async getDjEventsHistoryData(req, res, next) {
        try {
            const djs = await Djs.getDJEventsHistoryData();
            if (!Array.isArray(djs) || !djs.length) {
                return res.status(404).json({ message: 'No record found' });
            }
            return res.json({ data: djs });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}

export default DjsController;
