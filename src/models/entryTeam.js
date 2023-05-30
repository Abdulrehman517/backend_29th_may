import pool from '../config/database';


const EntryTeam = {
    findOne: async (first_name, last_name) => {
        try {
            const [results] = await pool.execute('SELECT * FROM entry_teams WHERE first_name = ? AND last_name = ?', [
                first_name,
                last_name,
            ]);
            return results[0];
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listAll: async () => {
        try {

            const sql = `SELECT * FROM entry_teams ORDER BY first_name`;

            const [results] = await pool.query(sql);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    AddEntryTeams: async (data) => {
        try {
            const sql = `INSERT into entry_teams (first_name, last_name, gender, instagram_url, payment_method, email, phone, lead_by, hourly_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                data.first_name.trim(),
                data.last_name,
                data.gender,
                data.instagram_url,
                data.payment_method,
                data.email,
                data.phone,
                data.lead_by,
                data.hourly_rate,
            ];
            const [results] = await pool.query(sql, values);
            // const results = await query(sql, values);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getEntryTeamById: async (id) => {
        try {
            // const results = await query('SELECT * FROM entry_teams WHERE id = ?', [id])
            const [results] = await pool.execute('SELECT * FROM entry_teams WHERE id = ?', [id]);
            // const result = rows[0];
            // return result;
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    updateEntryTeamDetails: async (data) => {
        const id = data.id;
        try {
            data.first_name = data.first_name.trim();
            // const results = await query('UPDATE entry_teams SET ? WHERE id = ?', [data, id]);
            const sql = 'UPDATE entry_teams SET ? WHERE id = ?';
            const [results] = await pool.query(sql, [data, id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    deleteEntryTeamDetails: async (id) => {
        try {
            // const results = await query('DELETE FROM entry_teams WHERE id = ?', id);
            await pool.query('DELETE FROM event_entry_teams WHERE entry_team_id = ?', id);
            const results = await pool.query('DELETE FROM entry_teams WHERE id = ?', id);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listByEvent: async (event_id) => {
        try {
            const [results] = await pool.query(
                'SELECT  est.entry_team_id as entry_team, est.start_time as start_time, est.end_time as end_time, est.total_amount as hourly_rate, est.paid_status as paid_status FROM events e LEFT JOIN event_entry_teams est ON e.id = est.event_id WHERE e.id = ? ORDER BY e.id, est.id',
                [event_id]
            );
            // const results = await query(sql);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listHistory: async (id, type) => {
        try {
            let queryString = `SELECT e.id, e.event_name, e.date from event_entry_teams eet join events e on e.id = eet.event_id where eet.entry_team_id = '${id}'`;
            if (type == 'Past') {
                queryString = queryString + ` And e.date < CURDATE() order by e.date desc`;
            } else if (type == 'Upcoming') {
                queryString = queryString + ` And e.date >= CURDATE() order by e.date Asc`;
            }
            const [results] = await pool.query(queryString);
            // const results = await query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getEntryTeamListByEventId: async (id) => {
        try {
            const sql = `SELECT en.id, CONCAT(en.first_name, ' ',en.last_name) as entry_member_name FROM entry_teams en LEFT JOIN event_entry_teams evt ON en.id = evt.entry_team_id AND evt.event_id = ? WHERE evt.event_id IS NULL;`;
            const [results] = await pool.query(sql, id);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    addEntryTeamWithEvent: async (entry_team_id, event_id, user_id) => {
        try {
            const sql = `INSERT INTO event_entry_teams(entry_team_id, event_id)VALUES(?, ?)`;
            const values = [entry_team_id, event_id];
            const [results] = await pool.query(sql, values);
            if (results) {
                let current_date = new Date();
                let current_utc_date_string2 = current_date.toISOString();
                const sql = `INSERT INTO activities(action, actor, table_name, record_id,event_id, date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                const activity_values = ['create', user_id, 'event_entry_teams', results.insertId, event_id, current_utc_date_string2];
                await pool.query(sql, activity_values);
            }
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
};

export default EntryTeam;
