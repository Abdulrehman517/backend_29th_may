import pool from '../config/database';

const Promoter = {
    findOne: async (username) => {
        try {
            const [results] = await pool.execute('SELECT * FROM promoters WHERE promoter_member_name = ?', [username]);
            return results[0];
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listAll: async () => {
        try {
            const sql = `SELECT * FROM promoters ORDER BY promoter_member_name`;
            const [results] = await pool.query(sql);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getPromoterListByEventId: async (id) => {
        try {
            const sql = `SELECT p.id, p.promoter_member_name FROM promoters p LEFT JOIN promoter_guests_history pg ON p.id = pg.promoter_id AND pg.event_id = ? WHERE pg.event_id IS NULL;`;
            const [results] = await pool.query(sql, id);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    AddPromoter: async (data) => {
        try {
            const sql = `INSERT into promoters (promoter_member_name, gender, instagram_url, payment_method, email, phone, guest_list_url, lead_by, hourly_rate, total_listed, total_attended) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                data.promoter_member_name.trim(),
                data.gender,
                data.instagram_url,
                data.payment_method,
                data.email,
                data.phone,
                data.guest_list_url,
                data.lead_by,
                data.hourly_rate,
                data.total_listed,
                data.total_attended,
            ];
            const results = await pool.query(sql, values);
            const lastInsertedId = results[0].insertId;

            for (let i in data.schedule_dates) {
                let schedule_date = data.schedule_dates[i];
                if (schedule_date != null) {
                    const sql = `INSERT INTO promoter_schedules(promoter_id, schedule_date)VALUES(?, ?)`;
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
    getPromoterById: async (id) => {
        try {
            const [results] = await pool.query('SELECT * FROM promoters WHERE id = ?', [id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getPromoterByEvent: async (id) => {
        try {
            const sql = `SELECT promoters.id, promoters.promoter_member_name as name  from promoter_guests_history join promoters on promoters.id = promoter_guests_history.promoter_id WHERE event_id = ?`;
            const selectValues = [id];
            const [results] = await pool.query(sql, selectValues);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    updatePromoterDetails: async (data) => {
        const id = data.id;
        try {
            let schedule_dates = data.schedule_dates;
            delete data.schedule_dates;
            data.promoter_member_name = data.promoter_member_name.trim();
            const results = await pool.query('UPDATE promoters SET ? WHERE id = ?', [data, id]);

            await pool.query('DELETE FROM promoter_schedules WHERE promoter_id = ?', [id]);
            for (let i in schedule_dates) {
                let schedule = schedule_dates[i];
                if (schedule != null) {
                    const sql = `INSERT INTO promoter_schedules(promoter_id, schedule_date)VALUES(?, ?)`;
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
    deletePromoterDetails: async (id) => {
        try {
            await pool.query('DELETE FROM promoter_guests_history WHERE promoter_id = ?', id);
            await pool.query('DELETE FROM promoter_schedules WHERE promoter_id = ?', id);
            const [results] = await pool.query('DELETE FROM promoters WHERE id = ?', id);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listByEvent: async (event_id) => {
        try {
            const [results] = await pool.query(
                'SELECT  est.promoter_id as member_name, est.guest_attended as table_guest_attended, est.male_comp_guest_attended as male_comp_guest_attended, est.female_comp_guest_attended as female_comp_guest_attended, est.total_earned as total_earned, est.paid_status as paid_status FROM events e LEFT JOIN promoter_guests_history est ON e.id = est.event_id WHERE e.id = ? ORDER BY e.id, est.id',
                [event_id]
            );
            // const [results] = await pool.query('SELECT promoter_id FROM event_promoters WHERE event_id = ?', [event_id])
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getPromoterSchedules: async (promoter_id) => {
        try {
            const [results] = await pool.query('SELECT schedule_date FROM promoter_schedules WHERE promoter_id =  ?', [promoter_id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getEventsByPromoters: async (promoter_id) => {
        try {
            const [results] = await pool.query(`SELECT events.id, events.event_name, events.date,
            ( SELECT guest_listed FROM promoter_guests_history WHERE event_id = events.id AND promoter_id = ? ) AS guest_listed,
            ( SELECT guest_attended FROM promoter_guests_history WHERE event_id = events.id AND promoter_id = ? ) AS guest_attended,
            ( SELECT comp_listed FROM promoter_guests_history WHERE event_id = events.id AND promoter_id = ? ) AS comp_listed,
            ( SELECT male_comp_guest_attended FROM promoter_guests_history WHERE event_id = events.id AND promoter_id = ? ) AS male_comp_guest_attended,
            ( SELECT female_comp_guest_attended FROM promoter_guests_history WHERE event_id = events.id AND promoter_id = ? ) AS female_comp_guest_attended
            FROM events LEFT JOIN promoter_guests_history AS pm ON events.id = pm.event_id  WHERE  events.date < CURDATE() GROUP BY events.id   ORDER BY   events.date;`, [promoter_id,promoter_id, promoter_id, promoter_id, promoter_id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getPromoterData: async () => {
        try {
            const [results] = await pool.query('SELECT * FROM promoter_guests_history');
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listTopHistory: async (data) => {
        try {
            const guest_listed = `SELECT ROUND(AVG(guest_listed)) AS avg_listed, ROUND(AVG(guest_attended)) AS avg_attended, AVG(conversion_rate) AS avg_conversion_rate FROM ( SELECT id, promoter_id, event_id,guest_listed, guest_attended, guest_attended/guest_listed * 100 AS conversion_rate FROM promoter_guests_history WHERE promoter_id = ? ORDER BY guest_attended DESC LIMIT 2) AS subquery;`;
            const [results_guest_listed] = await pool.query(guest_listed, [data.promoter_id]);
            const comp_listed = `SELECT ROUND(AVG(comp_listed)) AS avg_listed, ROUND(AVG(comp_attended)) AS avg_attended, AVG(conversion_rate) AS avg_conversion_rate FROM ( SELECT id, promoter_id, event_id, comp_listed, comp_attended, comp_attended/comp_listed * 100 AS conversion_rate FROM promoter_guests_history WHERE promoter_id = ? ORDER BY comp_attended DESC LIMIT 2) AS subquery;`;
            const [results_comp_listed] = await pool.query(comp_listed, [data.promoter_id]);
            if (results_guest_listed.length > 0 && results_comp_listed.length > 0) {
                let total_listed = results_guest_listed[0].avg_listed && parseInt(results_guest_listed[0].avg_listed) + results_comp_listed[0].avg_listed && parseInt(results_comp_listed[0].avg_listed);
                let total_attended = results_guest_listed[0].avg_attended && parseInt(results_guest_listed[0].avg_attended) + results_comp_listed[0].avg_attended && parseInt(results_comp_listed[0].avg_attended);
                if(isNaN(total_listed)){
                    total_listed =  null;
                }
                if(isNaN(total_attended)){
                    total_listed =  null;
                }
                const queryString = `UPDATE promoters SET total_listed = ?, total_attended = ? WHERE id = ?;`;
                await pool.query(queryString, [total_listed, total_attended, data.promoter_id]);
            }
            return;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    addPromoterHistory: async (data) => {
        try {
            await pool.query('DELETE FROM promoter_guests_history WHERE event_id = ? and promoter_id = ?', [
                data.event_id,
                data.promoter_id,
            ]);
            const sql = `INSERT into promoter_guests_history (promoter_id, event_id, guest_listed, guest_attended, comp_listed, comp_attended, total_earned, male_comp_guest_attended, female_comp_guest_attended) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                data.promoter_id,
                data.event_id,
                data.guest_listed  ? data.guest_listed : null,
                data.guest_attended  ? data.guest_attended : null,
                data.comp_listed  ? data.comp_listed : null,
                (data.female_comp_attended  && data.male_comp_attended )
                  ? data.female_comp_attended + data.male_comp_attended
                  : null,
                data.total_earned  ? data.total_earned : null,
                data.male_comp_attended  ? data.male_comp_attended : null,
                data.female_comp_attended  ? data.female_comp_attended : null,
              ];
              
            const [results] = await pool.query(sql, values);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    updatePromotersHistory: async (results) => {
        if (results.length > 0) {
            results.forEach(async (promoter) => {
                try {
                    const guest_listed = `SELECT ROUND(AVG(guest_listed)) AS avg_listed, ROUND(AVG(guest_attended)) AS avg_attended, AVG(conversion_rate) AS avg_conversion_rate FROM ( SELECT id, promoter_id, event_id,guest_listed, guest_attended, guest_attended/guest_listed * 100 AS conversion_rate FROM promoter_guests_history WHERE promoter_id = ? ORDER BY guest_attended DESC LIMIT 2) AS subquery;`;
                    const [results_guest_listed] = await pool.query(guest_listed, [promoter.promoter_id]);
                    const comp_listed = `SELECT ROUND(AVG(comp_listed)) AS avg_listed, ROUND(AVG(comp_attended)) AS avg_attended, AVG(conversion_rate) AS avg_conversion_rate FROM ( SELECT id, promoter_id, event_id, comp_listed, comp_attended, comp_attended/comp_listed * 100 AS conversion_rate FROM promoter_guests_history WHERE promoter_id = ? ORDER BY comp_attended DESC LIMIT 2) AS subquery;`;
                    const [results_comp_listed] = await pool.query(comp_listed, [promoter.promoter_id]);
                    if (results_guest_listed.length > 0 && results_comp_listed.length > 0) {
                        let total_listed = results_guest_listed[0].avg_listed && parseInt(results_guest_listed[0].avg_listed) + results_comp_listed[0].avg_listed && parseInt(results_comp_listed[0].avg_listed);
                        let total_attended = results_guest_listed[0].avg_attended && parseInt(results_guest_listed[0].avg_attended) + results_comp_listed[0].avg_attended && parseInt(results_comp_listed[0].avg_attended);
                        if(isNaN(total_listed)){
                            total_listed =  null;
                        }
                        if(isNaN(total_attended)){
                            total_listed =  null;
                        }
                        const queryString = `UPDATE promoters SET total_listed = ?, total_attended = ? WHERE id = ?;`;
                        await pool.query(queryString, [total_listed, total_attended, promoter.promoter_id]);
                    }
                    return;
                } catch (error) {
                    console.error(error);
                    throw new Error('An error occurred while executing the query.');
                }
            });
        }
        return;
    },

    listHistory: async (id) => {
        try {
            let queryString = '';
            queryString = `SELECT e.event_name, e.date, history.guest_listed, history.guest_attended, history.comp_listed, history.comp_attended From promoter_guests_history as history join events as e on e.id = history.event_id WHERE history.promoter_id = ? order by e.date Desc`;
            const [results] = await pool.query(queryString, [id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },

    getPromoterEventsHistoryData: async () => {
        try {
            const [results] = await pool.query('SELECT * from promoter_guests_history');
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    PromoterEventListHistory: async (id, type) => {
        try {
            let queryString = `SELECT e.id, e.event_name, e.date from promoter_guests_history pgh join events e on e.id = pgh.event_id where pgh.promoter_id = '${id}'`;
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
};

export default Promoter;
