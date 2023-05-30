import pool from '../config/database';

const Emails = {
    createContent: async (data) => {
        try {
            const selectSql = `SELECT * from email_content WHERE type = ?`;
            const selectValues = [data['type']];
            const [res] = await pool.query(selectSql, selectValues);
            var results = '';
            if (res.length > 0) {
                if (data['type'] == 'Lumi') {
                    console.log(data);
                    const sql = `UPDATE email_content SET radius = ?, fee_structure = ?, guest_list = ?, opportunities = ?, invoicing = ?, set_times = ?, header = ? , footer = ?, guest_list_header = ? WHERE type = ?`;
                    const values = [
                        data['radius'],
                        data['fee_structure'],
                        data['guest_list'],
                        data['opportunities'],
                        data['invoicing'],
                        data['set_times'],
                        data['header'],
                        data['footer'],
                        data['guest_list_header'],
                        data['type']
                    ];
                    console.log(sql)
                    console.log(values)
                    [results] = await pool.query(sql, values);
                    console.log(results);

                } else if (data['type'] == 'Hard') {
                    const sql = `UPDATE email_content SET radius = ?, fee_structure = ?, important = ?, guest_list = ?, opportunities = ?, invoicing = ?, set_times = ?, header = ?, footer = ?, guest_list_header = ? WHERE type = ?`;
                    const values = [
                        data['radius'],
                        data['fee_structure'],
                        data['important'],
                        data['guest_list'],
                        data['opportunities'],
                        data['invoicing'],
                        data['set_times'],
                        data['header'],
                        data['footer'],
                        data['guest_list_header'],
                        data['type']
                    ];
                    [results] = await pool.query(sql, values);
                } else if(data['type'] == 'Creative') {
                    const sql = `UPDATE email_content SET header = ?, important = ? WHERE type = ?`;
                    const values = [
                        data['header'],
                        data['important'],
                        data['type']
                    ];
                    [results] = await pool.query(sql, values);
                }
            } else {
                if (data['type'] == 'Lumi') {
                    const sql = `INSERT INTO email_content(type, radius, fee_structure, guest_list, opportunities, invoicing, set_times, header, footer, guest_list_header)VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    const values = [
                        data['type'],
                        data['radius'],
                        data['fee_structure'],
                        data['guest_list'],
                        data['opportunities'],
                        data['invoicing'],
                        data['set_times'],
                        data['header'],
                        data['footer'],
                        data['guest_list_header']
                    ];
                    [results] = await pool.query(sql, values);
                } else if (data['type'] == 'Hard') {
                    const sql = `INSERT INTO email_content(type, radius, fee_structure, important, guest_list, opportunities, invoicing, set_times, header, footer, guest_list_header)VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    const values = [
                        data['type'],
                        data['radius'],
                        data['fee_structure'],
                        data['important'],
                        data['guest_list'],
                        data['opportunities'],
                        data['invoicing'],
                        data['set_times'],
                        data['header'],
                        data['footer'],
                        data['guest_list_header']
                    ];
                    [results] = await pool.query(sql, values);
                } else if(data['type'] == 'Creative') {
                    const sql = `INSERT INTO email_content(header, important, type)VALUES(?, ?, ?)`;
                    const values = [
                        data['header'],
                        data['important'],
                        data['type']
                    ];
                    [results] = await pool.query(sql, values);
                }
            }
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getEmailConent: async (type) => {
        try {
            const selectSql = `SELECT * from email_content WHERE type = ?`;
            const selectValues = [type];
            const [result] = await pool.query(selectSql, selectValues);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getEmailLogsByDj: async (id) => {
        try {
            const selectSql = `SELECT date_time From email_logs WHERE time_set_id = ?`;
            const selectValues = [id];
            const [result] = await pool.query(selectSql, selectValues);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    }
};

export default Emails;
