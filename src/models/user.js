import bcrypt from 'bcryptjs';
import Cryptr from 'cryptr';
import pool from '../config/database';

const Users = {
    findOne: async (username) => {
        try {
            const [results] = await pool.execute(
                'SELECT *, (SELECT venue_name from venues WHERE id=users.venue_id ) as venue_name FROM users WHERE user_name = ?',
                [username]
            );
            return results[0];
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    listAll: async (data) => {
        try {
            const [results] = await pool.query(
                'SELECT *, (SELECT venue_name from venues WHERE id=users.venue_id ) as venue_name FROM users'
            );
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    Addusers: async (data) => {
        try {
            console.log(data);
            data['password_display'] = data['password'];
            const hash = await bcrypt.hash(data['password'], 8);
            const cryptr = new Cryptr('secret', { pbkdf2Iterations: 10000, saltLength: 5 });
            const encryptedString = cryptr.encrypt(data['password_display']);
            const decryptedString = cryptr.decrypt(encryptedString);
            const sql = `INSERT INTO users(user_name, email, password, role, password_display,venue_id, permissions)VALUES(?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                data['user_name'].trim(),
                data['email'].trim(),
                hash,
                data['role'],
                encryptedString,
                data['venue_id'],
                data['permissions'],
            ];
            const results = pool.query(sql, values);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getById: async (id) => {
        try {
            const [results] = await pool.execute(
                'SELECT user_name, email, role, password_display, venue_id, permissions FROM users WHERE id = ?',
                [id]
            );
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    deleteById: async (id) => {
        try {
            const [results] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    updateUserById: async (data) => {
        const id = data.id;
        try {
            const cryptr = new Cryptr('secret', { pbkdf2Iterations: 10000, saltLength: 5 });
            data.password = await bcrypt.hash(data.password_display, 8);
            data.password_display = cryptr.encrypt(data.password_display);
            const results = await pool.query('UPDATE users SET ? WHERE id = ?', [data, id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getUsersByRole: async (data) => {
        try {
            const [results] = await pool.execute('SELECT * from users WHERE role =?', ['lead']);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
};

export default Users;
