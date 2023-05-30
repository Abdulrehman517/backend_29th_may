import pool from '../config/database';

const Settings = {
    findOne: async (username) => {
        try {
            const [results] = await pool.execute('SELECT * FROM users_list WHERE name = ?', [username]);
            return results[0];
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listAll: async () => {
        try {
            const [results] = await pool.query('SELECT * FROM fee_list ORDER BY fee');
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    Addfee: async (data) => {
        try {
            const [results] = await pool.query('INSERT INTO fee_list (fee) VALUES (?)', [parseInt(data['fee'])]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    Adduser: async (data) => {
        try {
            const [results] = await pool.query('INSERT INTO users_list (name) VALUES (?)', [data['user'].trim()]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listAllUsers: async () => {
        try {
            const [results] = await pool.query('SELECT * FROM users_list ORDER BY name');
            return JSON.parse(JSON.stringify(results));
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    deleteFeeDetails: async (id) => {
        try {
            const results = await pool.query('DELETE FROM fee_list WHERE id = ?', [id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    deleteUserDetails: async (username) => {
        try {
            const queryString = await pool.query('UPDATE djs SET lead_by = NULL WHERE lead_by = ?', [username]);
            const entry_teams = await pool.query('UPDATE entry_teams SET lead_by = NULL WHERE lead_by = ?', [username]);
            const promoters = await pool.query('UPDATE promoters SET lead_by = NULL WHERE lead_by = ?', [username]);
            const event_set_time = await pool.query('UPDATE event_set_times SET added_by = NULL WHERE added_by = ?', [username]);
            const [results] = await pool.query('DELETE FROM users_list WHERE name = ?', [username]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getUsersStats: async () => {
        try {
            // const query = util.promisify(connection.query).bind(connection);
            let results = [];
            const [results_event_set] = await pool.query(
                'SELECT users_list.id, users_list.name, COALESCE(COUNT(event_set_times.added_by), 0) as events_records FROM users_list LEFT JOIN event_set_times ON users_list.name = event_set_times.added_by GROUP BY users_list.name ORDER BY users_list.name'
            );
            const [results_djs] = await pool.query(
                'SELECT users_list.id, users_list.name, COALESCE(COUNT(djs.lead_by), 0) as dj_records FROM users_list LEFT JOIN djs ON users_list.name = djs.lead_by GROUP BY users_list.name ORDER BY users_list.name'
            );
            const [results_promoters] = await pool.query(
                'SELECT users_list.id, users_list.name, COALESCE(COUNT(promoters.lead_by), 0) as promoters_records FROM users_list LEFT JOIN promoters ON users_list.name = promoters.lead_by GROUP BY users_list.name ORDER BY users_list.name'
            );
            const [results_entry_teams] = await pool.query(
                'SELECT users_list.id, users_list.name, COALESCE(COUNT(entry_teams.lead_by), 0) as entry_teams_records FROM users_list LEFT JOIN entry_teams ON users_list.name = entry_teams.lead_by GROUP BY users_list.name ORDER BY users_list.name'
            );
            results.push(results_djs);
            results.push(results_event_set);
            results.push(results_entry_teams);
            results.push(results_promoters);
            // console.log(results);
            return JSON.parse(JSON.stringify(results));
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getSuggestedFee: async (id) => {
        try {
            const [results] = await pool.execute('SELECT Fee, COUNT(*) AS Count FROM event_set_times WHERE dj_id = ? GROUP BY Fee ORDER BY Count DESC LIMIT 1;', [id]);
            return results
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },

};

export default Settings;
