import pool from '../config/database';

const ChangeLogs = {
    getChangeLogs: async (type) => {
        try {
            const selectSql = `SELECT ac.action, ac.table_name, ac.date_time,  ac.id AS action_id, ch.activity_id, ch.field_name, ch.old_value, ch.new_value, users.user_name, ac.record_id,
            COALESCE ((
                SELECT
                    performer_member_name 
                FROM
                    performers 
                WHERE
                    id = ( SELECT performer_id FROM event_performers WHERE id = ac.record_id AND ac.action = 'create' and ac.table_name='event_performers') 
                    ),
                '' 
            ) AS performer_member_name,
            COALESCE ((
                SELECT
                    CONCAT( event_name, ', ', date ) 
                    
                FROM
                events 
                WHERE
                    id = ( SELECT id FROM events WHERE id = ac.record_id AND ac.action = 'create' AND ac.table_name = 'event' ) 
                    ),
                '' 
            ) AS event_details,
            COALESCE ((
                SELECT
                    CONCAT( first_name, ' ', last_name ) 
                FROM
                    entry_teams 
                WHERE
                    id = ( SELECT entry_team_id FROM event_entry_teams WHERE id = ac.record_id AND ac.action = 'create' and ac.table_name='event_entry_teams' ) 
                    ),
                '' 
            ) AS entry_member_name,
            COALESCE ((
                SELECT
                    promoter_member_name 
                FROM
                    promoters 
                WHERE
                    id = ( SELECT promoter_id FROM promoter_guests_history WHERE id = ac.record_id AND ac.action = 'create' and ac.table_name='promoter_guests_history' ) 
                    ),
                '' 
            ) AS promoter_name,
            COALESCE ( v.venue_name, '' ) AS old_venue_name,
            COALESCE ( ve.venue_name, '' ) AS new_venue_name,
            COALESCE ((
                SELECT
                    CONCAT( start_time, '-', end_time ) 
                FROM
                    event_set_times 
                WHERE
                    id = ( SELECT id FROM event_set_times WHERE id = ac.record_id AND ac.action = 'create' and ac.table_name='event_set_times') 
                    ),
                '' 
            ) AS time_slot,
            CONCAT(e.event_name, ', ', e.date) as event_detail,
            (SELECT performer_member_name from performers as p1 WHERE p1.id=ch.old_value and ch.field_name='performer_id') as performer_old_name,
            (SELECT performer_member_name from performers as p2 WHERE p2.id=ch.new_value and ch.field_name='performer_id') as performer_new_name,
            
            (SELECT dj_name from djs as dj1 WHERE dj1.id=ch.old_value and ch.field_name='dj_id') as dj_old_name,
            (SELECT dj_name from djs as dj2 WHERE dj2.id=ch.new_value and ch.field_name='dj_id') as dj_new_name,
            (SELECT JSON_EXTRACT(data, '$[0].event_name', '$[0].date') FROM deleted_records as dr WHERE dr.record_id=ac.record_id and ac.action='delete') AS event_name,
            (SELECT JSON_EXTRACT(data, '$[0].event_name', '$[0].date') FROM deleted_records as drc WHERE drc.record_id=ac.event_id) AS deleted_event_name 
        FROM
            activities AS ac
            LEFT JOIN change_logs AS ch ON ac.id = ch.activity_id
            JOIN users ON ac.actor = users.id
            LEFT JOIN venues AS v ON v.id = ch.old_value 
            AND ch.field_name = 'venue_id'
            LEFT JOIN venues AS ve ON ve.id = ch.new_value 
            AND ch.field_name = 'venue_id'
            LEFT JOIN events as e on e.id=ac.event_id  
        ORDER BY
            ac.date_time desc;`;
           
            const [result] = await pool.query(selectSql);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    deletePastLogs: async () => {
        try {
            let queryString = `DELETE activities, change_logs FROM activities JOIN events ON activities.event_id = events.id LEFT JOIN change_logs ON change_logs.activity_id = activities.id
            WHERE events.date <= DATE_SUB(NOW(), INTERVAL 30 DAY);`;
            const [results] = await pool.query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
};

export default ChangeLogs;
