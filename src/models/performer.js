import pool from '../config/database';
import { getDifference } from '../lib/lib';
import moment from 'moment/moment.js';

const Performer = {
    findOne: async (username) => {
        try {
            const [results] = await pool.execute('SELECT * FROM performers WHERE performer_member_name = ?', [username]);
            return results[0];
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listAll: async () => {
        try {
            const sql = `SELECT performers.*, (SELECT GROUP_CONCAT(performer_affiliations.title SEPARATOR '!%') FROM performer_affiliations WHERE performer_affiliations.performer_id = performers.id) AS title FROM performers  ORDER BY performer_member_name`;
            const [results] = await pool.query(sql);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    AddPerformer: async (data) => {
        try {
            // const query = util.promisify(connection.query).bind(connection);
            const sql = `INSERT into performers (performer_member_name, gender, instagram_url, payment_method, email, phone, lead_by, set_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                data.performer_member_name.trim(),
                data.gender,
                data.instagram_url,
                data.payment_method,
                data.email,
                data.phone,
                data.lead_by,
                data.set_rate,
            ];

            const [results] = await pool.query(sql, values);

            // const results = await query(sql, values);
            const lastInsertedId = results.insertId;

            for (let i in data.Affiliations) {
                let aff = data.Affiliations[i].affiliation;
                if (aff != null) {
                    const sql = `INSERT INTO performer_affiliations(performer_id, title)VALUES(?, ?)`;
                    const values = [lastInsertedId, data.Affiliations[i].affiliation];
                    await pool.query(sql, values);
                }
            }
            for (let i in data.schedule_dates) {
                let schedule_date = data.schedule_dates[i];
                if (schedule_date != null) {
                    const sql = `INSERT INTO performer_schedules(performer_id, schedule_date)VALUES(?, ?)`;
                    const values = [lastInsertedId, data.schedule_dates[i]];
                    await pool.query(sql, values);
                }
            }
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getPerformerById: async (id) => {
        try {
            // const query = util.promisify(connection.query).bind(connection);
            const sql = `SELECT performers.*, (SELECT GROUP_CONCAT(performer_affiliations.title SEPARATOR '!%') FROM performer_affiliations WHERE performer_affiliations.performer_id = performers.id) AS title FROM performers WHERE performers.id = ?`;
            const [results] = await pool.query(sql, [id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    updatePerformerDetails: async (data) => {
        const id = data.id;
        try {
            let affs = data.Affiliations;
            let schedule_dates = data.schedule_dates;
            delete data.schedule_dates;
            delete data.Affiliations;
            delete data.title;
            data.performer_member_name = data.performer_member_name.trim();
            const [obj] = await pool.query('SELECT * FROM performers WHERE id = ?', [id]);
            if ((obj && obj[0] && obj[0].set_rate == null) || obj[0].set_rate == undefined) {
                await pool.query('UPDATE event_performers SET set_rate= ? WHERE performer_id = ?', [data.set_rate, id]);
            }
            const [results] = await pool.query('UPDATE performers SET ? WHERE id = ?', [data, id]);

            await pool.query('DELETE FROM performer_affiliations WHERE performer_id = ?', [id]);
            for (let i in affs) {
                let aff = affs[i].affiliation;
                if (affs[i].affiliation != null) {
                    const sql = `INSERT INTO performer_affiliations(performer_id, title)VALUES(?, ?)`;
                    const values = [id, affs[i].affiliation];
                    await pool.query(sql, values);
                }
            }

            await pool.query('DELETE FROM performer_schedules WHERE performer_id = ?', [id]);
            for (let i in schedule_dates) {
                let schedule = schedule_dates[i];
                if (schedule != null) {
                    const sql = `INSERT INTO performer_schedules(performer_id, schedule_date)VALUES(?, ?)`;
                    const values = [id, schedule];
                    await pool.query(sql, values);
                }
            }
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    updateBy: async (data) => {
        try {
            const sql =  `SELECT * FROM event_performers where event_id= ? and performer_id= ?;`;
            const values = [
                data.event_id,
                data.performer_id
            ]
            const [oldData] = await pool.query(sql, values);
            let oldArr = [];
            oldArr.push({
                performer_id:oldData[0].performer_id
            })
            let newData = {
                performer_id: data.updatedId
            }
            const diff = await getDifference(oldArr, newData);
            if (diff && diff.length > 0) {
                let current_date = new Date();
                let current_utc_date_string2 = current_date.toISOString();
                const sql = `INSERT INTO activities(action, actor, table_name, record_id,event_id, date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                const activity_values = ['update', data.user_id, 'event_performers', oldData[0].id, oldData[0].event_id, current_utc_date_string2];
                const [activityResults] = await pool.query(sql, activity_values);
                const activityId = activityResults.insertId;
                if (activityId) {
                    for (var d in diff) {
                        const sql_change_log = `INSERT INTO change_logs(activity_id, field_name, old_value, new_value)VALUES(?, ?, ?, ?)`;
                        const change_log_values = [activityId, diff[d].field_name, diff[d].old_value, diff[d].new_value];
                        await pool.query(sql_change_log, change_log_values);
                    }
                }

            }
            const queryString = `UPDATE event_performers SET performer_id = ? WHERE event_id = ? AND performer_id= ?;`;
            const [results] = await pool.query(queryString, [data.updatedId, data.event_id, data.performer_id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    deletePerformerDetails: async (id) => {
        try {
            await pool.query('DELETE FROM event_performers WHERE performer_id = ?', id);
            await pool.query('DELETE FROM performer_schedules WHERE performer_id = ?', id);
            const results = await pool.query('DELETE FROM performers WHERE id = ?', id);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },

    getPerformerSchedules: async (performer_id) => {
        try {
            const [results] = await pool.query('SELECT schedule_date FROM performer_schedules WHERE performer_id =  ?', [performer_id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },

    listByEvent: async (event_id) => {
        try {
            const [results] = await pool.query(
                'SELECT  est.performer_id as performer, est.set_rate as set_rate, est.paid_status as paid_status FROM events e LEFT JOIN event_performers est ON e.id = est.event_id WHERE e.id = ? ORDER BY e.id, est.id',
                [event_id]
            );
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },

    PerformerEventListHistory: async (id, type) => {
        try {
            let queryString = `SELECT e.id, e.event_name, e.date from event_performers ep join events e on e.id = ep.event_id where ep.performer_id = '${id}'`;
            if (type == 'Past') {
                queryString = queryString + ` And e.date < CURDATE() order by e.date desc`;
            } else if (type == 'Upcoming') {
                queryString = queryString + ` And e.date >= CURDATE() order by e.date Asc`;
            }
            const [results] = await pool.query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getPerformerListByEventId: async (id) => {
        try {
            const sql = `SELECT p.id, p.performer_member_name FROM performers p LEFT JOIN event_performers ep ON p.id = ep.performer_id AND ep.event_id = ? WHERE ep.event_id IS NULL;`;
            const [results] = await pool.query(sql, id);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    addPerformerWithEvent: async (performer_id, event_id, set_rate, user_id) => {
        try {
            const set_rate_data = set_rate != '' && set_rate != null ? set_rate.replace(/\$/g, '') : null;
            const sql = `INSERT INTO event_performers(performer_id, event_id, set_rate)VALUES(?, ?, ?)`;
            const values = [performer_id, event_id, set_rate_data];
            const [results] = await pool.query(sql, values);
            if(results){
                let current_date = new Date();
                let current_utc_date_string2 = current_date.toISOString();
                const sql = `INSERT INTO activities(action, actor, table_name, record_id,event_id, date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                const activity_values = ['create', user_id, 'event_performers', results.insertId, event_id, current_utc_date_string2];
                const [response] = await pool.query(sql, activity_values);
            }
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
};

export default Performer;
