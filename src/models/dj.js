import pool from '../config/database';
import { getDifference } from '../lib/lib';
import moment from 'moment/moment.js';

const Djs = {
    findOne: async (username) => {
        try {
            const [results] = await pool.execute('SELECT * FROM djs WHERE dj_name = ?', [username]);
            return results[0];
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listAll: async () => {
        try {
            const sql = `SELECT djs.*, (SELECT GROUP_CONCAT(dj_affiliations.title SEPARATOR '!%') FROM dj_affiliations WHERE dj_affiliations.dj_id = djs.id) AS title FROM djs WHERE djs.active_status =1 or djs.active_status is null ORDER BY dj_name`;
            const [results] = await pool.query(sql);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listRankwise: async () => {
        try {
            const sql = `SELECT djs.*, (SELECT GROUP_CONCAT(dj_affiliations.title SEPARATOR '!%') FROM dj_affiliations WHERE dj_affiliations.dj_id = djs.id) AS title FROM djs WHERE djs.active_status = 1 OR djs.active_status IS NULL ORDER BY CASE WHEN rating IS NULL THEN 1 ELSE 0 END, total_in DESC;`;
            const [results] = await pool.query(sql);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listDeActivated: async () => {
        try {
            const sql = `SELECT djs.*, (SELECT GROUP_CONCAT(dj_affiliations.title SEPARATOR '!%') FROM dj_affiliations WHERE dj_affiliations.dj_id = djs.id) AS title FROM djs WHERE djs.active_status =0 ORDER BY dj_name`;
            const [results] = await pool.query(sql);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    AddDjs: async (data) => {
        try {
            const sql = `INSERT into djs(dj_name,first_name, last_name, gender, instagram_url, guest_list_url, payment_method, date_of_birth, email, phone, total_is, total_in, conversion_rate, lead_by, active_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                data.dj_name.trim(),
                data.first_name,
                data.last_name,
                data.gender,
                data.instagram_url,
                data.guest_list_url,
                data.payment_method,
                data.date_of_birth,
                data.email,
                data.phone,
                data.total_is,
                data.total_in,
                data.conversion_rate,
                data.lead_by,
                data.active_status,
            ];
            const [results] = await pool.query(sql, values);
            const lastInsertedId = results.insertId;
            for (let i in data.Affiliations) {
                let aff = data.Affiliations[i].affiliation;
                if (aff != null) {
                    const sql = `INSERT INTO dj_affiliations(dj_id, title)VALUES(?, ?)`;
                    const values = [lastInsertedId, data.Affiliations[i].affiliation];
                    await pool.query(sql, values);
                }
            }

            for (let i in data.schedule_dates) {
                let aff = data.schedule_dates[i];
                if (aff != null) {
                    const sql = `INSERT INTO dj_schedules(dj_id, schedule_date)VALUES(?, ?)`;
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
    getDjById: async (id) => {
        try {
            const sql = `SELECT djs.*, (SELECT GROUP_CONCAT(dj_affiliations.title SEPARATOR '!%') FROM dj_affiliations WHERE dj_affiliations.dj_id = djs.id) AS title FROM djs WHERE djs.id = '${id}'`;
            const [results] = await pool.query(sql);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getDjByEvent: async (id) => {
        try {
            const sql = `SELECT djs.id, dj_name From event_set_times join djs on djs.id = event_set_times.dj_id WHERE event_id = ?`;
            const selectValues = [id];
            const [results] = await pool.query(sql, selectValues);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    updatedjDetails: async (data) => {
        const id = data.id;
        try {
            let affs = data.Affiliations;
            let schedule_dates = data.schedule_dates;
            delete data.Affiliations;
            delete data.schedule_dates;
            delete data.title;
            data.dj_name = data.dj_name.trim();

            const sql = 'UPDATE djs SET ? WHERE id = ?';
            const values = [data, id];
            const [results] = await pool.query(sql, values);
            await pool.query('DELETE FROM dj_affiliations WHERE dj_id = ?', [id]);

            for (let i in affs) {
                let aff = affs[i].affiliation;
                if (affs[i].affiliation && affs[i].affiliation != null) {
                    const sql = `INSERT INTO dj_affiliations(dj_id, title)VALUES(?, ?)`;
                    const values = [id, affs[i].affiliation];
                    await pool.query(sql, values);
                }
            }
            await pool.execute('DELETE FROM dj_schedules WHERE dj_id = ?', [id]);

            for (let i in schedule_dates) {
                let schedule = schedule_dates[i];
                if (schedule != null) {
                    const sql = `INSERT INTO dj_schedules(dj_id, schedule_date)VALUES(?, ?)`;
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
    deletedjDetails: async (id) => {
        try {
            const sql = 'DELETE FROM djs WHERE id = ?';
            const values = [id];
            const [result] = await pool.query(sql, values);
            return result.affectedRows === 1;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listHistory: async (id, type) => {
        try {
            let queryString = '';
            if (type == 'History') {
                queryString = `SELECT e.event_name, e.date, history.listed, history.attended From dj_guests_history as history join events as e on e.id = history.event_id WHERE dj_id = '${id}' order by e.date Desc`;
            } else {
                queryString = `SELECT e.id, e.event_name, e.date, concat(TIME_FORMAT(st.start_time, '%h:%i'),'-',TIME_FORMAT(st.end_time, '%h:%i')) as set_time from event_set_times as st join events as e on st.event_id = e.id WHERE dj_id ='${id}'`;
                if (type == 'Past') {
                    queryString = queryString + ` And e.date < CURDATE() order by e.date desc`;
                } else if (type == 'Upcoming') {
                    queryString = queryString + ` And e.date >= CURDATE() order by e.date Asc`;
                }
            }

            const [results] = await pool.query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    updateFee: async (data) => {
        try {
            if (data.timeset_id) {
                const sql = `SELECT * FROM event_set_times where id=${data.timeset_id};`;
                const [oldData] = await pool.query(sql);
                let oldArr = [];
                oldArr.push({
                    fee: oldData[0].fee
                })
                let newData = {
                    fee: data.fee
                }
                const diff = await getDifference(oldArr, newData);
                if (diff && diff.length > 0) {
                    let current_date = new Date();
                    let current_utc_date_string2 = current_date.toISOString();
                    const sql = `INSERT INTO activities(action, actor, table_name, record_id,event_id, date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                    const activity_values = ['update', data.user_id, 'event_set_times', data.timeset_id, oldData[0].event_id, current_utc_date_string2];
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
            }
            const queryString = `UPDATE event_set_times SET fee = '${data.fee}' WHERE id = '${data.timeset_id}';`;
            const [results] = await pool.query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    updateBy: async (data) => {
        try {
            if (data.timeset_id) {
                const sql = `SELECT * FROM event_set_times where id=${data.timeset_id};`;
                const [oldData] = await pool.query(sql);
                let oldArr = [];
                oldArr.push({
                    by: oldData[0].added_by
                })
                let newData = {
                    by: data.by
                }
                const diff = await getDifference(oldArr, newData);
                if (diff && diff.length > 0) {
                    let current_date = new Date();
                    let current_utc_date_string2 = current_date.toISOString();
                    const sql = `INSERT INTO activities(action, actor, table_name, record_id,event_id, date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                    const activity_values = ['update', data.user_id, 'event_set_times', data.timeset_id, oldData[0].event_id, current_utc_date_string2];
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
            }
            const queryString = `UPDATE event_set_times SET added_by = '${data.by}' WHERE id = '${data.timeset_id}';`;
            const [results] = await pool.query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    updateNotes: async (data) => {
        try {
            if (data.timeset_id) {
                const sql = `SELECT * FROM event_set_times where id=${data.timeset_id};`;
                const [oldData] = await pool.query(sql);
                let oldArr = [];
                oldArr.push({
                    notes: oldData[0].notes
                })
                let newData = {
                    notes: data.notes
                }
                const diff = await getDifference(oldArr, newData);
                if (diff && diff.length > 0) {
                    let current_date = new Date();
                    let current_utc_date_string2 = current_date.toISOString();
                    const sql = `INSERT INTO activities(action, actor, table_name, record_id,event_id, date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                    const activity_values = ['update', data.user_id, 'event_set_times', data.timeset_id, oldData[0].event_id, current_utc_date_string2];
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
            }
            const updateSql = `UPDATE event_set_times SET notes = ? WHERE id = ?`;
            const updateValues = [data.notes, data.timeset_id];
            const [results] = await pool.query(updateSql, updateValues);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    addDjHistory: async (data) => {
        try {
            const query = 'DELETE FROM dj_guests_history WHERE event_id = ? and dj_id = ?';
            const delete_values = [data.event_id, data.dj_id];
            const [rows, fields] = await pool.query(query, delete_values);

            const sql = `INSERT into dj_guests_history (dj_id, event_id, listed, attended) VALUES (?, ?, ?, ?)`;
            const values = [data.dj_id, data.event_id, data.listed, data.attended];
            const [results] = await pool.query(sql, values);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listTopHistory: async (id) => {
        try {
            const sql = `SELECT ROUND(AVG(listed)) AS avg_listed, ROUND(AVG(attended)) AS avg_attended, AVG(conversion_rate) AS avg_conversion_rate FROM ( SELECT id, dj_id, event_id,listed, attended, attended/listed * 100 AS conversion_rate FROM dj_guests_history WHERE dj_id = '${id}' ORDER BY attended DESC LIMIT 2) AS subquery;`;
            const [results] = await pool.query(sql);
            if (results.length > 0) {
                let avg_listed = results[0].avg_listed ? parseInt(results[0].avg_listed) : null;
                let avg_attended = results[0].avg_attended ? parseInt(results[0].avg_attended) : null;
                let avg_conversion_rate = results[0].avg_conversion_rate ? results[0].avg_conversion_rate : null;
                avg_conversion_rate = Number(avg_conversion_rate).toFixed(1);
                const queryString = `UPDATE djs SET total_is = ${avg_listed}, total_in = ${avg_attended}, conversion_rate = ${avg_conversion_rate} WHERE id = ${id};`;
                await pool.query(queryString);
            }
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getDjSchedules: async (dj_id) => {
        try {
            const [results] = await pool.execute('SELECT schedule_date FROM dj_schedules WHERE dj_id = ?', [dj_id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    activateDj: async (dj_id) => {
        try {
            const queryString = `UPDATE djs SET active_status = 1 WHERE id = '${dj_id}';`;
            const [results] = await pool.query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    updateRank: async (rank, dj_id) => {
        try {
            const queryString = `UPDATE djs SET rating = ${rank} WHERE id = ${dj_id};`;
            const [results] = await pool.query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listRecommended: async (venue_id, event_date) => {
        try {
            const [results] = await pool.execute(
                'SELECT e.dj_id, d.dj_name,d.total_in, MAX(ev.date) AS last_event_date, DATEDIFF(?, MAX(ev.date)) AS days_since_last_event FROM event_set_times e LEFT JOIN events ev ON e.event_id = ev.id LEFT JOIN djs d ON e.dj_id = d.id WHERE ev.venue_id = ? and d.active_status = 1 GROUP BY e.dj_id ORDER BY d.total_in desc',
                [event_date, venue_id]
            );
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getTimesetByDj: async (setTimeId) => {
        try {
            const selectSql = `SELECT *, est.fee as dj_fee from event_set_times as est join events on events.id = est.event_id join venues on venues.id = events.venue_id WHERE est.id = ?`;
            const selectValues = [setTimeId];
            const [result] = await pool.query(selectSql, selectValues);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getDJEventsHistoryData: async () => {
        try {
            const [results] = await pool.query('SELECT * from dj_guests_history');
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
};

export default Djs;
