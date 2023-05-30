import { getDifference } from '../lib/lib';
import moment from 'moment/moment.js';
import pool from '../config/database';

const Events = {
    listAll: async (type) => {
        try {
            let queryString =
                "SELECT e.id, e.event_name AS event_name, e.creative_recieved as creative_recieved, e.creative_sent as creative_sent, e.creative_sent_date as creative_sent_date, e.creative_recieved_date as creative_recieved_date, est.id as set_time_id, est.start_time, est.end_time, est.fee, est.added_by, est.notes as set_time_notes, est.dj_status,d.id as dj_id, d.dj_name AS dj_name,  e.date as date,  e.fee as notes,  e.notes as notes, e.start_event_time as start_event_time, e.end_event_time as end_event_time, e.type as type, v.id as venue_id, v.venue_name, els.status as email_status,  (SELECT GROUP_CONCAT(concat(entry_teams.first_name ,' ',entry_teams.last_name) SEPARATOR ',') FROM event_entry_teams JOIN entry_teams ON event_entry_teams.entry_team_id = entry_teams.id WHERE event_id = e.id) as entry_team_member,  (SELECT GROUP_CONCAT(entry_teams.id SEPARATOR ',') FROM event_entry_teams JOIN entry_teams ON event_entry_teams.entry_team_id = entry_teams.id WHERE event_id = e.id) as entry_team_member_id, (SELECT GROUP_CONCAT(performer_member_name SEPARATOR ',') FROM event_performers JOIN performers ON event_performers.performer_id = performers.id WHERE event_id = e.id) as performer_member_name, (SELECT GROUP_CONCAT(performers.id SEPARATOR ',') FROM event_performers JOIN performers ON event_performers.performer_id = performers.id WHERE event_id = e.id) as performer_id,( SELECT GROUP_CONCAT( promoter_member_name SEPARATOR ',' ) FROM promoter_guests_history JOIN promoters ON promoter_guests_history.promoter_id = promoters.id WHERE event_id = e.id ) AS promoter_member_name, ( SELECT  GROUP_CONCAT( promoters.id SEPARATOR ',' )  FROM  promoter_guests_history JOIN promoters ON promoter_guests_history.promoter_id = promoters.id   WHERE event_id = e.id  ) AS promoter_id  FROM events e LEFT JOIN event_set_times est ON e.id = est.event_id LEFT JOIN djs d ON est.dj_id = d.id LEFT JOIN venues v ON e.venue_id = v.id LEFT JOIN email_logs els ON est.id = els.time_set_id";
            if (type == 'Lumi') {
                queryString += " where venue_name like '%Lumi%'";
            } else if (type == 'Hard') {
                queryString += " where venue_name like '%Hard%'";
            } else if (type == 'Past') {
                queryString += ' where e.date < CURDATE()';
            } else if (type == 'Upcoming') {
                queryString += ' where e.date >= CURDATE()';
            }

            queryString += ' ORDER BY e.date,est.id;';

            const [results] = await pool.query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    AddEvents: async (data) => {
        try {
            console.log('create new event....', data['user_id']);
            const sql = `INSERT INTO events(venue_id, event_name, date, start_event_time, end_event_time, added_by)VALUES(?, ?, ?, ?, ?, ?)`;
            const main_values = [
                data['venues'],
                data['event_name'],
                data['date'],
                data['start_event_time'],
                data['end_event_time'],
                data['user_id'],
            ];
            const [results] = await pool.query(sql, main_values);
            
            /*Creating the Activity Logs*/
            const insertId = results.insertId
            if(insertId){
                let current_date = new Date();
                let current_utc_date_string2 = current_date.toISOString();
                const sql = `INSERT INTO activities(action, actor, table_name, record_id,event_id, date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                const activity_values = ['create', data['user_id'], 'event', insertId, insertId, current_utc_date_string2];
                const [results] = await pool.query(sql, activity_values);
            }

            for (let i in data['set_times']) {
                let set_times = data['set_times'][i];
                if (set_times != null) {
                    const sql = `INSERT INTO event_set_times(dj_id, start_time, end_time, event_id, fee, notes, added_by, dj_status, paid_status, created_by)VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    const values = [
                        set_times['dj'],
                        set_times['start_time'],
                        set_times['end_time'],
                        results.insertId,
                        set_times['fee'],
                        set_times['notes'],
                        set_times['added_by'],
                        set_times['dj_status'],
                        set_times['paid_status'],
                        data['user_id']
                    ];
                    await pool.query(sql, values);
                }
            }

            for (let i in data['promoters']) {
                let promoters = data['promoters'][i];
                if (promoters && promoters.member_name != null) {
                    const sql = `INSERT INTO promoter_guests_history(promoter_id, event_id, guest_attended, comp_attended, male_comp_guest_attended, female_comp_guest_attended, total_earned, paid_status, created_by)VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    const total_comp_attended =
                        promoters.male_comp_guest_attended != '' &&
                        promoters.male_comp_guest_attended != null &&
                        promoters.female_comp_guest_attended != '' &&
                        promoters.female_comp_guest_attended != null
                            ? parseInt(promoters.male_comp_guest_attended) + parseInt(promoters.female_comp_guest_attended)
                            : null;
                    const values = [
                        promoters.member_name,
                        results.insertId,
                        promoters.table_guest_attended,
                        total_comp_attended,
                        promoters.male_comp_guest_attended,
                        promoters.female_comp_guest_attended,
                        promoters.total_earned.replace(/\$/g, ''),
                        promoters.paid_status,
                        data['user_id']
                    ];
                    await pool.query(sql, values);
                }
            }
            for (let i in data['entryTeams']) {
                let entryTeams = data['entryTeams'][i];
                if (entryTeams && entryTeams.entry_team != null) {
                    const hourly_rate =
                        entryTeams['hourly_rate'] != '' && entryTeams['hourly_rate'] != null
                            ? entryTeams['hourly_rate'].replace(/\$/g, '')
                            : null;
                    const sql = `INSERT INTO event_entry_teams(entry_team_id, event_id, start_time, end_time, total_amount, paid_status, created_by)VALUES(?, ?, ?, ?, ?, ?, ?)`;
                    const values = [
                        entryTeams['entry_team'],
                        results.insertId,
                        entryTeams['start_time'],
                        entryTeams['end_time'],
                        hourly_rate,
                        entryTeams['paid_status'],
                        data['user_id']
                    ];
                    await pool.query(sql, values);
                }
            }

            for (let i in data['performers']) {
                let performers = data['performers'][i];
                const set_rate =
                    performers['set_rate'] != '' && performers['set_rate'] != null ? performers['set_rate'].replace(/\$/g, '') : null;
                if (performers && performers.performer != null) {
                    const sql = `INSERT INTO event_performers(performer_id, event_id, set_rate, paid_status, created_by)VALUES(?, ?, ?, ?, ?)`;
                    const values = [
                        performers['performer'],
                        results.insertId,
                        set_rate,
                        performers['paid_status'],
                        data['user_id']
                    ];
                    await pool.query(sql, values);
                }
            }
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getEventById: async (id) => {
        try {
            let queryString = `SELECT e.id, e.event_name AS event_name, e.start_event_time as start_event_time, e.end_event_time as end_event_time, e.venue_id as venue_id,  est.id as set_time_id, est.start_time, est.end_time,  est.fee, est.added_by, est.notes as set_time_notes, est.dj_status, est.paid_status as paid_status, d.dj_name AS dj_name, d.id AS dj_id, e.date as date, e.fee as notes, e.notes as notes,e.start_event_time as start_event_time ,e.end_event_time as end_event_time , e.type as type,els.id as logs_id, els.status as email_status FROM events e LEFT JOIN event_set_times est ON e.id = est.event_id LEFT JOIN djs d ON est.dj_id = d.id LEFT JOIN email_logs els ON est.id = els.time_set_id WHERE e.id = '${id}' ORDER BY e.id, est.id;`;
            const [results] = await pool.query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    findOne: async (id) => {
        try {
            let queryString = `SELECT * from events WHERE id= ?;`;
            const [results] = await pool.query(queryString, [id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getEventBriteById: async (id) => {
        try {
            let queryString = `SELECT * from event_brite_details where event_id='${id}';`;
            const [results] = await pool.query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getEventByDj: async (id) => {
        try {
            let queryString = `SELECT events.id, events.event_name, events.date, (SELECT listed from dj_guests_history WHERE dj_id = '${id}' and event_id = events.id ) as listed, (SELECT attended from dj_guests_history WHERE dj_id = '${id}' and event_id = events.id ) as attended FROM events JOIN event_set_times ON event_set_times.event_id = events.id WHERE event_set_times.dj_id = '${id}'  AND events.date < CURDATE()  GROUP BY events.id ORDER BY events.date`;
            const [results] = await pool.query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    updateeventDetails: async (id, data) => {
        try {
            // let current_utc_date_string2 = moment.utc().format('YYYY-MM-DD HH:mm:ss');
            let current_date = new Date();
            let current_utc_date_string2 = current_date.toISOString();
            /*get existing event record for comparison*/
            let oldData = await pool.query('SELECT event_name, date, start_event_time, end_event_time, venue_id FROM events WHERE id = ?', [id]);
            const newData = {
                event_name: data.event_name,
                date: data.date,
                start_event_time: data.start_event_time,
                end_event_time: data.end_event_time,
                venue_id: data.venue_id,
            };
            console.log(oldData[0]);
            console.log(newData);
            const diff = await getDifference(oldData[0], newData);
            if(diff &&  diff.length > 0){
                console.log('update events data and insert their history');
                console.log(diff)
                const sql = `INSERT INTO activities(action, actor, table_name, record_id,event_id, date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                const activity_values = ['update', data.user_id, 'event', id, id, current_utc_date_string2];
                const [activityResults] = await pool.query(sql, activity_values);
                const activityId = activityResults.insertId;
                if(activityId){
                    for (var d in diff) {
                        console.log(diff[d])
                        const sql_change_log = `INSERT INTO change_logs(activity_id, field_name, old_value, new_value)VALUES(?, ?, ?, ?)`;
                        const change_log_values = [activityId, diff[d].field_name, diff[d].old_value, diff[d].new_value];
                        await pool.query(sql_change_log, change_log_values);
                    }
                }

            }
            
            const queryString = `UPDATE events SET event_name = '${data.event_name}' , date = '${data.date}' , start_event_time = '${data.start_event_time}', end_event_time = '${data.end_event_time}', venue_id = '${data.venue_id}' WHERE id = '${id}';`;
            const [results] = await pool.query(queryString);

            // event brite details and change logs start
            let [oldEventBriteData] = await pool.query('SELECT * FROM event_brite_details WHERE event_id = ?', [id]);
            const newEventBriteData = {
                eb_comp_listed: data.eb_comp_listed,
                eb_comp_attended: data.eb_comp_attended,
                eb_paid_listed: data.eb_paid_listed,
                eb_paid_attended: data.eb_paid_attended
            };
            if (oldEventBriteData.length > 0) {

                const diffEventBriteData = await getDifference(oldEventBriteData, newEventBriteData);
                if (diffEventBriteData && diffEventBriteData.length > 0) {

                    const sql = `INSERT INTO activities(action, actor, table_name, record_id,event_id, date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                    const activity_values = ['update', data.user_id, 'event_brite_details', oldEventBriteData[0].id, id,current_utc_date_string2];
                    const [activityResults] = await pool.query(sql, activity_values);
                    const activityId = activityResults.insertId;
                    if (activityId) {
                        for (var d in diffEventBriteData) {
                            const sql_change_log = `INSERT INTO change_logs(activity_id, field_name, old_value, new_value)VALUES(?, ?, ?, ?)`;
                            const change_log_values = [activityId, diffEventBriteData[d].field_name, diffEventBriteData[d].old_value, diffEventBriteData[d].new_value];
                            await pool.query(sql_change_log, change_log_values);
                        }
                    }

                }
                const queryString = `UPDATE event_brite_details SET eb_comp_listed = ? , eb_comp_attended = ? , eb_paid_listed = ?, eb_paid_attended = ? , created_by = ? where event_id= ?;`;
                const values = [
                    data['eb_comp_listed'] ? data['eb_comp_listed'] : null,
                    data['eb_comp_attended'] ? data['eb_comp_attended'] : null,
                    data['eb_paid_listed'] ? data['eb_paid_listed'] : null,
                    data['eb_paid_attended'] ? data['eb_paid_attended'] : null,
                    data.user_id,
                    id
                ];
                const [results] = await pool.query(queryString, values);
            } else {
                if (data['eb_comp_listed'] || data['eb_comp_attended'] || data['eb_paid_listed'] || data['eb_paid_attended']) {
                    var queryString2 = `INSERT INTO event_brite_details(event_id, eb_comp_listed, eb_comp_attended, eb_paid_listed, eb_paid_attended, created_by)VALUES(?, ?, ?, ?, ?, ?)`;
                    const values = [
                        id,
                        data['eb_comp_listed'] ? data['eb_comp_listed'] : null,
                        data['eb_comp_attended'] ? data['eb_comp_attended'] : null,
                        data['eb_paid_listed'] ? data['eb_paid_listed'] : null,
                        data['eb_paid_attended'] ? data['eb_paid_attended'] : null,
                        data.user_id
                    ];
                    try {
                        let [lastInserted] = await pool.query(queryString2, values);
                        let oldDataArray = [];
                        oldDataArray.push({
                            eb_comp_listed: null,
                            eb_comp_attended: null,
                            eb_paid_listed: null,
                            eb_paid_attended: null
                        })
            
                        const diffEventBriteData = await getDifference(oldDataArray, newEventBriteData);
                        if (diffEventBriteData && diffEventBriteData.length > 0) {
                            const sql = `INSERT INTO activities(action, actor, table_name, record_id,event_id, date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                            const activity_values = ['update', data.user_id, 'event_brite_details', lastInserted.insertId, id,current_utc_date_string2];
                            const [activityResults] = await pool.query(sql, activity_values);
                            const activityId = activityResults.insertId;
                            if (activityId) {
                                for (var d in diffEventBriteData) {
                                    const sql_change_log = `INSERT INTO change_logs(activity_id, field_name, old_value, new_value)VALUES(?, ?, ?, ?)`;
                                    const change_log_values = [activityId, diffEventBriteData[d].field_name, diffEventBriteData[d].old_value, diffEventBriteData[d].new_value];
                                    await pool.query(sql_change_log, change_log_values);
                                }
                            }
        
                        }
                        
                    } catch (error) {
                        throw error;
                    }
                }
            }
            // event brite  details and change logs end
            // start set time difference
            const selectSql = `SELECT * FROM event_set_times WHERE event_id = ?;`;
            const selectValues = [id];
            const [existingRow] = await pool.query(selectSql, selectValues);
            let previousRecords = existingRow;
            

            await pool.query('DELETE FROM event_set_times WHERE event_id = ?', [id]);

            for (var i in data['set_times']) {
                let set_times = data['set_times'][i];
                if (set_times && set_times != null) {
                    var queryString2 = `INSERT INTO event_set_times(dj_id, start_time, end_time, event_id, fee, notes, added_by, dj_status, paid_status)VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    const values = [
                        set_times['dj'],
                        set_times['start_time'],
                        set_times['end_time'],
                        id,
                        set_times['fee'],
                        set_times['notes'],
                        set_times['added_by'],
                        set_times['dj_status'],
                        set_times['paid_status'],
                    ];
                    try {
                        const [settimesResult] = await pool.query(queryString2, values);
                        
                        if(set_times['email_logs_id'] && set_times['dj_email_status'] && settimesResult.insertId){
                            const updateSql = `UPDATE email_logs SET time_set_id = ? WHERE id = ?`;
                            const updateValues = [settimesResult.insertId, set_times['email_logs_id']];
                            await pool.query(updateSql, updateValues);
                        }

                    } catch (error) {
                        throw error;
                    }
                }
            }

            for (let i in data['set_times']) {
                let set_time = data['set_times'][i];
                if (set_time && set_time != null) {
                    const newPerformerData = {
                        paid_status: set_time.paid_status,
                        start_time: set_time.start_time,
                        end_time: set_time.end_time,
                        fee: set_time.fee == '' || set_time.fee == null ? null: set_time.fee,
                        added_by: set_time.added_by == '' || set_time.added_by == null ? null : set_time.added_by,
                        notes: set_time.notes == '' || set_time.notes == null ? null : set_time.notes,
                        dj_status:set_time.dj_status == '' || set_time.dj_status == null ? null : set_time.dj_status,
                        dj_id: set_time.dj == 0 || set_time.dj == null ? null : set_time.dj 
                       
                    };
                    let existingRow = previousRecords.find(obj => obj.id == set_time.set_time_id);
                    
                    if (existingRow) {
                        /*change logs*/
                        const oldData = {
                            paid_status: existingRow.paid_status,
                            start_time: existingRow.start_time,
                            end_time: existingRow.end_time,
                            fee: existingRow.fee == '' || existingRow.fee == null ? null: existingRow.fee,
                            added_by: existingRow.added_by == '' || existingRow.added_by == null ? null : existingRow.added_by,
                            notes: existingRow.notes == '' || existingRow.notes == null ? null : existingRow.notes,
                            dj_status:existingRow.dj_status == '' || existingRow.dj_status == null ? null : existingRow.dj_status,
                            dj_id: existingRow.dj_id == 0 || existingRow.dj_id == null ? null : existingRow.dj_id 
                           
                        };
                        let oldArrayData = [];
                        oldArrayData.push(oldData);
                        const diffPerformers = await getDifference(oldArrayData, newPerformerData);
                        if(diffPerformers &&  diffPerformers.length > 0){
                            const sql = `INSERT INTO activities(action, actor, table_name, record_id,event_id, date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                            const activity_values = ['update', data.user_id, 'event_set_times', existingRow.id, id, current_utc_date_string2];
                            const [activityResults] = await pool.query(sql, activity_values);
                            const activityId = activityResults.insertId;
                            if(activityId){
                                for (let d in diffPerformers) {
                                    const sql_change_log = `INSERT INTO change_logs(activity_id, field_name, old_value, new_value)VALUES(?, ?, ?, ?)`;
                                    const change_log_values = [activityId, diffPerformers[d].field_name, diffPerformers[d].old_value, diffPerformers[d].new_value];
                                    await pool.query(sql_change_log, change_log_values);
                                }
                            }
            
                        }
                    } else {
                        const checkSql = `SELECT * FROM event_set_times WHERE event_id = ? and start_time= ? and end_time= ?`;
                        const [checkResults] = await pool.query(checkSql, [id, set_time['start_time'], set_time['end_time']]);
                        const sql = `INSERT INTO activities(action, actor, table_name, record_id, event_id,date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                        const activity_values = ['create', data.user_id, 'event_set_times', checkResults[0].id, id, current_utc_date_string2];
                        const [activityResults] = await pool.query(sql, activity_values);                
                    }
                }
            }  

            // Get all the performers IDs from the incoming data
            const incomingPerformerIds = data['performers'] && data['performers'].map((item) => item?.performer);
            // Get all the existing performers IDs from the database for the given event ID
            const selectExistingPerformerSql = `SELECT performer_id FROM event_performers WHERE event_id = ?`;
            const selectExistingPerfomerValues = [id];
            const [existingPerformerRows] = await pool.query(selectExistingPerformerSql, selectExistingPerfomerValues);
            const existingPerformerIds = existingPerformerRows.map((row) => row.performer_id);

            // Loop through all the incoming performers data
            for (let i in data['performers']) {
                let performers = data['performers'][i];
                if (performers && performers.performer != null) {
                    const selectSql = `SELECT * FROM event_performers WHERE event_id = ? AND performer_id = ?`;
                    const selectValues = [id, performers.performer];
                    const [existingRow] = await pool.query(selectSql, selectValues);
                    const total_earned =
                        performers.set_rate != '' && performers.set_rate != null ? performers.set_rate.replace(/\$/g, '') : null;
                    if (existingRow.length > 0) {
                        /*change logs*/
                        let oldPerformerData = existingRow;
                        const newPerformerData = {
                            performer_id: performers.performer,
                            paid_status: performers.paid_status,
                           
                        };

                        const diffPerformers = await getDifference(oldPerformerData, newPerformerData);

                        if(diffPerformers &&  diffPerformers.length > 0){
                            const sql = `INSERT INTO activities(action, actor, table_name, record_id, event_id,date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                            const activity_values = ['update', data.user_id, 'event_performers', existingRow[0].id, id, current_utc_date_string2];
                            const [activityResults] = await pool.query(sql, activity_values);
                            const activityId = activityResults.insertId;
                            if(activityId){
                                for (let d in diffPerformers) {
                                    const sql_change_log = `INSERT INTO change_logs(activity_id, field_name, old_value, new_value)VALUES(?, ?, ?, ?)`;
                                    const change_log_values = [activityId, diffPerformers[d].field_name, diffPerformers[d].old_value, diffPerformers[d].new_value];
                                    await pool.query(sql_change_log, change_log_values);
                                }
                            }
            
                        }
                   
                        const updateSql = `UPDATE event_performers SET set_rate = ?, paid_status = ? WHERE event_id = ? AND performer_id = ?`;
                        const updateValues = [total_earned, performers.paid_status, id, performers.performer];
                        await pool.query(updateSql, updateValues);
                    } else {
                        /*activity log*/
                        const insertSql = `INSERT INTO event_performers(performer_id, event_id, set_rate, paid_status,created_by)VALUES(?, ?, ?, ?, ?)`;
                        const insertValues = [
                            performers.performer,
                            id,
                            total_earned,
                            performers.paid_status,
                            data.user_id
                        ];
                        const [performersResults] = await pool.query(insertSql, insertValues);
                        /*Creating the Activity Logs*/
                        const insertId = performersResults.insertId
                        if(insertId) {
                            const sql = `INSERT INTO activities(action, actor, table_name, record_id, event_id,date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                            const activity_values = ['create', data.user_id, 'event_performers', insertId, id, current_utc_date_string2];
                            await pool.query(sql, activity_values);
                        }
                    }
                }
            }
            if (incomingPerformerIds) {
                // Delete all the performers records that exist in the database but not in the incoming data
                const deletePerformerIds = existingPerformerIds.filter(
                    (existingEntryTeamId) => !incomingPerformerIds.includes(existingEntryTeamId)
                );
                if (deletePerformerIds.length > 0) {
                    const deleteSql = `DELETE FROM event_performers WHERE event_id = ? AND performer_id IN (?)`;
                    const deleteValues = [id, deletePerformerIds];
                    await pool.query(deleteSql, deleteValues);
                }
            } else {
                await pool.query('DELETE FROM event_performers WHERE event_id = ?', [id]);
            }

            // Get all the entry team IDs from the incoming data
            const incomingEntryTeamsIds = data['entryTeams'] && data['entryTeams'].map((promoter) => promoter?.entry_team);

            // Get all the existing entry team IDs from the database for the given event ID
            const selectExistingEntryTeamSql = `SELECT entry_team_id FROM event_entry_teams WHERE event_id = ?`;
            const selectExistingEntryTeamValues = [id];
            const [existingEntryTeamRows] = await pool.query(selectExistingEntryTeamSql, selectExistingEntryTeamValues);
            const existingEntryTeamIds = existingEntryTeamRows.map((row) => row.entry_team_id);

            // Loop through all the incoming entryTeams
            for (let i in data['entryTeams'] && data['entryTeams']) {
                let entryTeams = data['entryTeams'] && data['entryTeams'][i];
                if (entryTeams && entryTeams.entry_team != null) {
                    const selectSql = `SELECT * FROM event_entry_teams WHERE event_id = ? AND entry_team_id = ?`;
                    const selectValues = [id, entryTeams.entry_team];
                    const [existingRow] = await pool.query(selectSql, selectValues);
                    const total_earned =
                        entryTeams.hourly_rate != '' && entryTeams.hourly_rate != null ? entryTeams.hourly_rate.replace(/\$/g, '') : null;
                    if (existingRow.length > 0) {
                        // change logs 
                        let oldEntrtyTeamData = existingRow;
                        const newEntryTeamData = {
                            entry_team_id: entryTeams.entry_team,
                            paid_status: entryTeams.paid_status,
                            start_time: entryTeams.start_time,
                            end_time: entryTeams.end_time

                        };

                        const diffEntryTeam = await getDifference(oldEntrtyTeamData, newEntryTeamData);
                        if (diffEntryTeam && diffEntryTeam.length > 0) {
                            const sql = `INSERT INTO activities(action, actor, table_name, record_id, event_id,date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                            const activity_values = ['update', data.user_id, 'event_entry_teams', existingRow[0].id, id, current_utc_date_string2];
                            const [activityResults] = await pool.query(sql, activity_values);
                            const activityId = activityResults.insertId;
                            if (activityId) {
                                for (let d in diffEntryTeam) {
                                    const sql_change_log = `INSERT INTO change_logs(activity_id, field_name, old_value, new_value)VALUES(?, ?, ?, ?)`;
                                    const change_log_values = [activityId, diffEntryTeam[d].field_name, diffEntryTeam[d].old_value, diffEntryTeam[d].new_value];
                                    await pool.query(sql_change_log, change_log_values);
                                }
                            }

                        }
                        const updateSql = `UPDATE event_entry_teams SET start_time = ?, end_time = ?, paid_status = ?, total_amount = ? WHERE event_id = ? AND entry_team_id = ?`;
                        const updateValues = [
                            entryTeams.start_time,
                            entryTeams.end_time,
                            entryTeams.paid_status,
                            total_earned,
                            id,
                            entryTeams.entry_team,
                        ];
                        await pool.query(updateSql, updateValues);
                    } else {
                        const insertSql = `INSERT INTO event_entry_teams(entry_team_id, event_id, start_time, end_time,  total_amount, paid_status, created_by)VALUES(?, ?, ?, ?, ?, ?, ?)`;
                        const insertValues = [
                            entryTeams.entry_team,
                            id,
                            entryTeams.start_time,
                            entryTeams.end_time,
                            total_earned,
                            entryTeams.paid_status,
                            data.user_id
                        ];
                        const [entryResults] = await pool.query(insertSql, insertValues);
                        /*Creating the Activity Logs*/
                        const insertId = entryResults.insertId
                        if(insertId) {
                            const sql = `INSERT INTO activities(action, actor, table_name, record_id, event_id,date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                            const activity_values = ['create', data.user_id, 'event_entry_teams', insertId, id, current_utc_date_string2];
                            await pool.query(sql, activity_values);
                        }
                    }
                }
            }
            if (incomingEntryTeamsIds) {
                // Delete all the entry teams records that exist in the database but not in the incoming data
                const deleteEntryTeamIds = existingEntryTeamIds.filter(
                    (existingEntryTeamId) => !incomingEntryTeamsIds.includes(existingEntryTeamId)
                );
                if (deleteEntryTeamIds.length > 0) {
                    const deleteSql = `DELETE FROM event_entry_teams WHERE event_id = ? AND entry_team_id IN (?)`;
                    const deleteValues = [id, deleteEntryTeamIds];
                    await pool.query(deleteSql, deleteValues);
                }
            } else {
                await pool.query('DELETE FROM event_entry_teams WHERE event_id = ?', [id]);
            }

            // Get all the promoter IDs from the incoming data
            const incomingPromoterIds = data['promoters'] && data['promoters'].map((promoter) => promoter?.member_name);

            // Get all the existing promoter IDs from the database for the given event ID
            const selectExistingPromotersSql = `SELECT promoter_id FROM promoter_guests_history WHERE event_id = ?`;
            const selectExistingPromotersValues = [id];
            const [existingPromoterRows] = await pool.query(selectExistingPromotersSql, selectExistingPromotersValues);
            const existingPromoterIds = existingPromoterRows.map((row) => row.promoter_id);

            // Loop through all the incoming promoters
            for (let i in data['promoters'] && data['promoters']) {
                let promoters = data['promoters'][i];
                if (promoters && promoters.member_name != null) {
                    const selectSql = `SELECT * FROM promoter_guests_history WHERE event_id = ? AND promoter_id = ?`;
                    const selectValues = [id, promoters.member_name];
                    const [existingRow] = await pool.query(selectSql, selectValues);
                    const total_earned =
                        promoters.total_earned != '' && promoters.total_earned != null ? promoters.total_earned.replace(/\$/g, '') : null;
                    if (existingRow.length > 0) {
                        // // change logs 
                        let oldPromoterData = existingRow;
                        const newPromoterData = {
                            promoter_id: promoters.member_name,
                            paid_status: promoters.paid_status,
                            guest_attended: promoters.table_guest_attended,
                            male_comp_guest_attended:promoters.male_comp_guest_attended,
                            female_comp_guest_attended: promoters.female_comp_guest_attended,
                                
                        };

                        const diffPromoter = await getDifference(oldPromoterData, newPromoterData);
                        if (diffPromoter && diffPromoter.length > 0) {
                            const sql = `INSERT INTO activities(action, actor, table_name, record_id, event_id,date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                            const activity_values = ['update', data.user_id, 'promoter_guests_history', existingRow[0].id, id, current_utc_date_string2];
                            const [activityResults] = await pool.query(sql, activity_values);
                            const activityId = activityResults.insertId;
                            if (activityId) {
                                for (let d in diffPromoter) {
                                    const sql_change_log = `INSERT INTO change_logs(activity_id, field_name, old_value, new_value)VALUES(?, ?, ?, ?)`;
                                    const change_log_values = [activityId, diffPromoter[d].field_name, diffPromoter[d].old_value, diffPromoter[d].new_value];
                                    await pool.query(sql_change_log, change_log_values);
                                }
                            }

                        }

                        const updateSql = `UPDATE promoter_guests_history 
                        SET 
                        guest_attended = ?, 
                        comp_attended = ?, 
                        male_comp_guest_attended = ?, 
                        female_comp_guest_attended = ?, 
                        total_earned = ?, 
                        paid_status = ?
                        WHERE event_id = ? AND promoter_id = ?`;
                        const total_comp_attended =
                            promoters.male_comp_guest_attended != '' &&
                            promoters.male_comp_guest_attended != null &&
                            promoters.female_comp_guest_attended != '' &&
                            promoters.female_comp_guest_attended != null
                                ? parseInt(promoters.male_comp_guest_attended) + parseInt(promoters.female_comp_guest_attended)
                                : null;
                        const updateValues = [
                            promoters.table_guest_attended,
                            total_comp_attended,
                            promoters.male_comp_guest_attended,
                            promoters.female_comp_guest_attended,
                            total_earned,
                            promoters.paid_status,
                            id,
                            promoters.member_name,
                        ];
                        await pool.query(updateSql, updateValues);
                    } else {
                        const insertSql = `INSERT INTO promoter_guests_history(
                            promoter_id, 
                            event_id, 
                            guest_attended, 
                            comp_attended, 
                            male_comp_guest_attended, 
                            female_comp_guest_attended, 
                            total_earned, 
                            paid_status,
                            created_by
                        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                        const total_comp_attended = (promoters.male_comp_guest_attended != '' && promoters.male_comp_guest_attended != null && promoters.female_comp_guest_attended !='' && promoters.female_comp_guest_attended != null) ? parseInt(promoters.male_comp_guest_attended) + parseInt(promoters.female_comp_guest_attended) : null;
                        const insertValues = [
                            promoters.member_name,
                            id,
                            promoters.table_guest_attended,
                            total_comp_attended,
                            promoters.male_comp_guest_attended,
                            promoters.female_comp_guest_attended,
                            total_earned,
                            promoters.paid_status,
                            data.user_id
                        ];
                        const promoterResults = await pool.query(insertSql, insertValues);
                        /*Creating the Activity Logs*/
                        const insertId = promoterResults[0].insertId
                        if(insertId) {
                            const sql = `INSERT INTO activities(action, actor, table_name, record_id, event_id,date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                            const activity_values = ['create', data.user_id, 'promoter_guests_history', insertId, id, current_utc_date_string2];
                            await pool.query(sql, activity_values);
                        }
                    }
                }
            }
            if (incomingPromoterIds) {
                // Delete all the promoter records that exist in the database but not in the incoming data
                const deletePromoterIds = existingPromoterIds.filter(
                    (existingPromoterId) => !incomingPromoterIds.includes(existingPromoterId)
                );
                if (deletePromoterIds.length > 0) {
                    const deleteSql = `DELETE FROM promoter_guests_history WHERE event_id = ? AND promoter_id IN (?)`;
                    const deleteValues = [id, deletePromoterIds];
                    await pool.query(deleteSql, deleteValues);
                }
            } else {
                await pool.query('DELETE FROM promoter_guests_history WHERE event_id = ?', [id]);
            }

            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    deleteeventDetails: async (id) => {
        try {
            await pool.query('DELETE FROM events WHERE id = ?', [id]);

            await pool.query('DELETE FROM event_entry_teams WHERE event_id = ?', [id]);

            await pool.query('DELETE FROM event_performers WHERE event_id = ?', [id]);

            await pool.query('DELETE FROM promoter_guests_history WHERE event_id = ?', [id]);

            await pool.query('DELETE FROM dj_guests_history WHERE event_id = ?', [id]);
            let [results] = await pool.query('DELETE FROM event_set_times WHERE event_id = ?', [id]);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    assignDjtoEvent: async (data) => {
        try {
            if (data.timeset_id) {
                const sql = `SELECT * FROM event_set_times where id=${data.timeset_id};`;
                const [oldData] = await pool.query(sql);
                let oldArr = [];
                oldArr.push({
                    fee: oldData[0].fee == '' || oldData[0].fee == null ? null : oldData[0].fee,
                    dj_id: oldData[0].dj_id == 0 || oldData[0].dj_id == null ? null : oldData[0].dj_id,
                    status: oldData[0].dj_status
                })
                let newData = {
                    fee: data.fee == '' || data.fee == null ? null : data.fee,
                    dj_id: data.dj_id == 0 || data.dj_id == null ? null : data.dj_id,
                    status: data.status
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
            const updateSql = `UPDATE event_set_times SET dj_id = ?, dj_status = ? , fee = ?  WHERE id = ?`;
            const updateValues = [data.dj_id, data.status, data.fee, data.timeset_id];
            const [results] = await pool.query(updateSql, updateValues);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    addEmaiLogs: async (data) => {
        try {
            // Check if a record with the same time_set_id exists
            const checkSql = `SELECT COUNT(*) as count FROM email_logs WHERE time_set_id = ?`;
            const [checkResults] = await pool.query(checkSql, [data['time_set_id']]);
            const count = checkResults[0].count;
            if (count > 0) {
                // If a record exists, update it
                const updateSql = `UPDATE email_logs SET event_id = ?, dj_id = ?, status = ?, date_time = ? WHERE time_set_id = ?`;
                const updateValues = [data['event_id'], data['dj_id'], data['status'], data['date_time'], data['time_set_id']];
                const [updateResults] = await pool.query(updateSql, updateValues);
                return updateResults;
            } else {
                // If no record exists, insert a new record
                const insertSql = `INSERT INTO email_logs(event_id, dj_id, time_set_id, status, date_time)
                                  VALUES (?, ?, ?, ?, ?)`;
                const insertValues = [data['event_id'], data['dj_id'], data['time_set_id'], data['status'], data['date_time']];
                const [insertResults] = await pool.query(insertSql, insertValues);
                return insertResults;
            }
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    emailLogs: async () => {
        try {
            const sql = `SELECT *, el.type as email_type From email_logs as el join events as e on e.id = el.event_id join djs as dj on dj.id = el.dj_id join event_set_times as est on est.id = el.time_set_id join venues as v on e.venue_id = v.id ORDER BY el.date_time Asc`;
            const [results] = await pool.query(sql);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    changeEmailStatus: async (djId, timeSetId) => {
        try {
            console.log(djId)
            console.log(timeSetId)
            
            const queryString = `UPDATE email_logs SET status = 'Confirmed' WHERE dj_id = '${djId}' and time_set_id = '${timeSetId}';`;
            
            console.log(queryString);

            const [results] = await pool.query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    setCreativeStatus: async (id, type, date, status, user_id) => {
        try {
            const sql = `SELECT * FROM events where id=${id};`;
            const [oldData] = await pool.query(sql);
            let oldArr = [];
            let newValues = "";
            if (type == 'sent') {
                oldArr.push({
                    creative_sent: oldData[0].creative_sent,
                })
                newValues = {
                    creative_sent: status
                }
            }
            if (type == 'recieved') {
                oldArr.push({
                    creative_recieved: oldData[0].creative_recieved,
                })
                newValues = {
                    creative_recieved: status
                }
            }
            const diff = await getDifference(oldArr, newValues);
            if (diff && diff.length > 0) {
                let current_date = new Date();
                let current_utc_date_string2 = current_date.toISOString();
                const sql = `INSERT INTO activities(action, actor, table_name, record_id,event_id, date_time)VALUES(?, ?, ?, ?, ?, ?)`;
                const activity_values = ['update', user_id, 'event', id, id, current_utc_date_string2];
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
            let queryString = '';
            if (type == 'sent') {
                queryString = `UPDATE events SET creative_sent = '${status}',`;
                if (status == 0) {
                    queryString += ` creative_sent_date= null WHERE id = '${id}'`;
                } else {
                    queryString += ` creative_sent_date= '${date}' WHERE id = '${id}'`;
                }
            } else if (type == 'recieved') {
                queryString = `UPDATE events SET creative_recieved = '${status}',`;
                if (status == 0) {
                    queryString += ` creative_recieved_date=null WHERE id = '${id}';`;
                } else {
                    queryString += ` creative_recieved_date='${date}' WHERE id = '${id}';`;
                }
            }
            const [results] = await pool.query(queryString);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    setCreativeEmailTime: async (id, date) => {
        try {
                let queryString = `UPDATE events SET creative_email_time = '${date}' WHERE id = '${id}'`;
                const [results] = await pool.query(queryString);
                return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    saveCreativeDesign: async (id, file) => {
        try {
            console.log(id)
            const sql = 'UPDATE events SET creative_design_file = ? WHERE id = ?';
            const values = [file, id];
            const [results] = await pool.query(sql, values);
            console.log(results);
            return results
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getDJEmailsByEvent: async (id) => {
        const selectSql = `SELECT est.id as set_time_id,est.start_time, est.end_time,dj.id as dj_id, dj.dj_name, dj.email From event_set_times as est join djs as dj on dj.id  = est.dj_id where est.event_id = ? and dj.email != ''`;
        const selectValues = [id];
        const [result] = await pool.query(selectSql, selectValues);
        return result;
    },
    getEventDesign: async (id) => {
        const selectSql = `SELECT creative_design_file, creative_email_time From events WHERE id = ?`;
        console.log(selectSql);
        const selectValues = [id];
        const [result] = await pool.query(selectSql, selectValues);
        return result;
    },
    addCreativeLogs: async (data) => {
        try {
            const sql = `INSERT INTO creative_logs(event_id, date_time, type)VALUES(?, ?, ?)`;
            const main_values = [data['event_id'], data['date_time'], data['type']];
            const [results] = await pool.query(sql, main_values);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    getDJHistoryByEvent: async (id) => {
        try {
            const selectSql = `SELECT dj_id from dj_guests_history where event_id = ?`;
            const selectValues = [id];
            const [result] = await pool.query(selectSql, selectValues);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },    
    getPromoterHistoryByEvent: async (id) => {
        try {
            const selectSql = `SELECT promoter_id from promoter_guests_history where event_id = ?`;
            const selectValues = [id];
            const [result] = await pool.query(selectSql, selectValues);
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },

    listAllEventDjs: async (id) => {
        try {
            const sql = `SELECT  est.dj_id,(SELECT listed FROM dj_guests_history WHERE dj_id = est.dj_id and event_id='${id}') as total_is,
            (SELECT attended FROM dj_guests_history WHERE dj_id = est.dj_id and event_id='${id}') as total_in,
            (SELECT dj_name FROM djs WHERE id=est.dj_id) as dj_name,
            (SELECT guest_list_url FROM djs WHERE id=est.dj_id) as guest_list_url
            FROM event_set_times as est WHERE est.event_id='${id}' and est.dj_id !=0;`;
            const [results] = await pool.query(sql);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },

    listAllEventPromoters: async (id) => {
        try {
            const sql = `SELECT pm.promoter_member_name as dj_name, pm.guest_list_url, pgh.guest_listed, pgh.guest_attended, pgh.comp_listed, pgh.comp_attended, pgh.male_comp_guest_attended, pgh.female_comp_guest_attended FROM
            promoter_guests_history as pgh JOIN promoters as pm ON pgh.promoter_id = pm.id  
            WHERE pgh.event_id='${id}';`;

            const [results] = await pool.query(sql);
            return results;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },
    updateEventBrite: async (id, data) => {
        try {
            const sql = 'select * from event_brite_details where event_id= ?;';
            const event_id = [id];
            const [existingObj] = await pool.query(sql, event_id);
            if(existingObj.length>0){
                const queryString = `UPDATE event_brite_details SET eb_comp_listed = ? , eb_comp_attended = ? , eb_paid_listed = ?, eb_paid_attended = ? , created_by = ? where event_id= ?;`;
                const values = [
                    data['eb_comp_listed'] ? data['eb_comp_listed'] : null,
                    data['eb_comp_attended'] ? data['eb_comp_attended'] : null,
                    data['eb_paid_listed'] ? data['eb_paid_listed'] : null,
                    data['eb_paid_attended'] ? data['eb_paid_attended'] : null,
                    data.user_id,
                    id
                ];
                const [results] = await pool.query(queryString, values);
            } else {
                var queryString2 = `INSERT INTO event_brite_details(event_id, eb_comp_listed, eb_comp_attended, eb_paid_listed, eb_paid_attended, created_by)VALUES(?, ?, ?, ?, ?, ?)`;
                const values = [
                    id,
                    data['eb_comp_listed'] ? data['eb_comp_listed'] : null,
                    data['eb_comp_attended'] ? data['eb_comp_attended'] : null,
                    data['eb_paid_listed'] ? data['eb_paid_listed'] : null,
                    data['eb_paid_attended'] ? data['eb_paid_attended'] : null,
                    data.user_id
                ];
                
                await pool.query(queryString2, values);
            }
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while executing the query.');
        }
    },

};
export default Events;
