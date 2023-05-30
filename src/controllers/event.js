import Events from '../models/event.js';
import EntryTeam from '../models/entryTeam.js';
import Promoter from '../models/promoter.js';
import Performer from '../models/performer.js';
import Emails from '../models/email.js';
import Users from '../models/user.js';
import moment from 'moment/moment.js';
import Djs from '../models/dj.js';
import DjsController from './dj.js';
import pool from '../config/database';
import path from 'path';

const table_guest_rate = 10;
const female_comp_guest_rate = 4;
const male_comp_guest_rate = 2;

import { sendEmail } from '../lib/mail';

class EventsController {
    constructor() {}

    static async list(req, res, next) {
        try {
            let event_type = req.params.type;
            const events = await Events.listAll(event_type);
            if (!Array.isArray(events) || !events.length) {
                return res.json({ message: 'No Events found', data: [] });
            }
            // First, group the objects by event_name
            const groups = {};
            events.forEach((obj) => {
                if (!groups[obj.id]) {
                    groups[obj.id] = [];
                }
                groups[obj.id].push(obj);
            });

            // Then, format each group
            const output = Object.keys(groups).map((value) => {
                const group = groups[value];

                const set_times_value = group.map((obj) => {
                    let startTime = '';
                    let endTime = '';
                    /*startTime formating*/
                    if (obj && obj.start_time && obj.start_time != null) {
                        let start_time_array = obj.start_time.split(':');
                        let start_hour = start_time_array[0] % 12;
                        start_time_array[0] = start_hour ? start_hour : 12; // the hour '0' should be '12
                        startTime = start_time_array.join(':');
                    }
                    /*endTime formating*/
                    if (obj && obj.end_time && obj.end_time != null) {
                        let end_time_array = obj.end_time.split(':');
                        let end_hour = end_time_array[0] % 12;
                        end_time_array[0] = end_hour ? end_hour : 12; // the hour '0' should be '12
                        endTime = end_time_array.join(':');
                    }

                    const time_set = `${startTime}-${endTime}`;
                    const dj_name = obj.dj_name || 'None';
                    const dj_id = obj.dj_id || 'None';
                    const set_time_id = obj.set_time_id || 'None';
                    const fee = obj.fee != null ? '$' + obj.fee.toString() : 'None';
                    const added_by = obj.added_by || 'None';
                    const notes = obj.set_time_notes || 'None';
                    const dj_status = obj.dj_status || 'hold';
                    const dj_email_status = obj.email_status || '';
                    const venue_name = obj.venue_name || '';
                    return { set_time_id, time_set, dj_id, dj_name, dj_email_status, fee, added_by, notes, dj_status, venue_name };
                });

                const date_value = group.map((obj) => {
                    return obj.date;
                });
                const id_value = group.map((obj) => {
                    return obj.id;
                });

                const event_name_value = group.map((obj) => {
                    return obj.event_name;
                });

                const creative_recieved_value = group.map((obj) => {
                    return obj.creative_recieved;
                });

                const creative_sent_date_value = group.map((obj) => {
                    return obj.creative_sent_date;
                });

                const creative_recieved_date_value = group.map((obj) => {
                    return obj.creative_recieved_date;
                });

                const creative_sent_value = group.map((obj) => {
                    return obj.creative_sent;
                });

                const entry_team_member_value = group.map((obj) => {
                    return obj.entry_team_member;
                });
                const entry_team_member_id_value = group.map((obj) => {
                    return obj.entry_team_member_id;
                });

                const performer_member_value = group.map((obj) => {
                    return obj.performer_member_name;
                });
                const performer_member_id_value = group.map((obj) => {
                    return obj.performer_id;
                });

                const promoter_member_value = group.map((obj) => {
                    return obj.promoter_member_name;
                });
                const promoter_member_id_value = group.map((obj) => {
                    return obj.promoter_id;
                });

                const venue_id_value = group.map((obj) => {
                    return obj.venue_id;
                });

                const date = date_value.length > 0 ? date_value[0] : '';

                const event_name = event_name_value.length > 0 ? event_name_value[0] : '';
                const creative_recieved = creative_recieved_value.length > 0 ? creative_recieved_value[0] : '';
                const creative_sent_date = creative_sent_date_value.length > 0 ? creative_sent_date_value[0] : '';
                const creative_sent = creative_sent_value.length > 0 ? creative_sent_value[0] : '';
                const creative_recieved_date = creative_recieved_date_value.length > 0 ? creative_recieved_date_value[0] : '';

                const venue_id = venue_id_value.length > 0 ? venue_id_value[0] : '';
                const id = id_value.length > 0 ? id_value[0] : '';
                let entry_team_member = entry_team_member_value.length > 0 ? entry_team_member_value[0] : '';
                let entry_team_member_id = entry_team_member_id_value.length > 0 ? entry_team_member_id_value[0] : '';
                entry_team_member = entry_team_member != null ? entry_team_member.split(',') : [];
                entry_team_member_id = entry_team_member_id != null ? entry_team_member_id.split(',') : [];
                let entry_members_array = [];
                entry_members_array.push({ id: 0, name: "None"});
                for (let index in entry_team_member) {
                    let entry_object = { id: entry_team_member_id[index], name: entry_team_member[index] };
                    entry_members_array.push(entry_object);
                }

                let performer_member = performer_member_value.length > 0 ? performer_member_value[0] : '';
                let performer_member_id = performer_member_id_value.length > 0 ? performer_member_id_value[0] : '';
                performer_member = performer_member != null ? performer_member.split(',') : [];
                performer_member_id = performer_member_id != null ? performer_member_id.split(',') : [];
                let performer_member_array = [];
                performer_member_array.push({ id: 0, name: "None"});
                for (let index in performer_member) {
                    let entry_object = { id: performer_member_id[index], name: performer_member[index] };
                    performer_member_array.push(entry_object);
                }

                // promoter data logic
                let promoter_member = promoter_member_value.length > 0 ? promoter_member_value[0] : '';
                let promoter_member_id = promoter_member_id_value.length > 0 ? promoter_member_id_value[0] : '';

                promoter_member = promoter_member != null ? promoter_member.split(',') : [];
                promoter_member_id = promoter_member_id != null ? promoter_member_id.split(',') : [];
                let promoter_member_array = [];
                promoter_member_array.push({ id: 0, name: "None"});
                for (let index in promoter_member) {
                    let promoter_object = { id: promoter_member_id[index], name: promoter_member[index], type:"None" };
                    promoter_member_array.push(promoter_object);
                }

                let set_times = [...set_times_value].reverse();
                return {
                    id,
                    event_name,
                    creative_recieved,
                    creative_sent,
                    creative_sent_date,
                    creative_recieved_date,
                    date,
                    set_times,
                    entry_team_member,
                    entry_members_array,
                    venue_id,
                    performer_member,
                    performer_member_array,
                    promoter_member,
                    promoter_member_array
                };
            });

            return res.json({ data: output });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }

    static async create(req, res, next) {
        try {
            const { event_name } = req.body;
            if (!event_name || event_name.trim() == '') {
                return res.status(400).json({ message: 'Event Name is required' });
            }
            const data = req.body;
            data.user_id = req.user.id;
            await Events.AddEvents(data);
            return res.json({ message: 'success' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async getById(req, res, next) {
        try {
            const events = await Events.getEventById(req.params.id);
            const event_brite_details = await Events.getEventBriteById(req.params.id);
            const entry_teams = await EntryTeam.listByEvent(req.params.id);
            const event_promoters = await Promoter.listByEvent(req.params.id);
            const event_performers = await Performer.listByEvent(req.params.id);
            const allList = await EntryTeam.listAll();

            function calculateTimeDifference(startTime, endTime) {
                let start = moment(startTime, 'hh:mm');
                let end = moment(endTime, 'hh:mm');
                if (end.isBefore(start)) {
                    end.add(1, 'day');
                }
                let duration = moment.duration(end.diff(start));
                let hours = duration.asHours();
                return hours;
            }

            function updateEntryTeamWithTotalAmount(entry_teams, allEntryTeamArr) {
                allEntryTeamArr.forEach((allEntryTeamObj) => {
                    if (allEntryTeamObj.hourly_rate) {
                        const matchingEntryTeamObj = entry_teams.find((entryTeamObj) => entryTeamObj.entry_team == allEntryTeamObj.id);
                        if (matchingEntryTeamObj) {
                            if (matchingEntryTeamObj.start_time && matchingEntryTeamObj.end_time) {
                                const hoursWorked = calculateTimeDifference(matchingEntryTeamObj.start_time, matchingEntryTeamObj.end_time);
                                if (hoursWorked > 0) {
                                    const totalAmount = hoursWorked * allEntryTeamObj.hourly_rate;
                                    matchingEntryTeamObj.hourly_rate = totalAmount.toFixed(2);
                                } else {
                                    matchingEntryTeamObj.hourly_rate = null;
                                }
                            } else {
                                matchingEntryTeamObj.hourly_rate = null;
                            }
                        }
                    }
                });
                return entry_teams.filter((entryTeamObj) => entryTeamObj.entry_team != null);
            }

            let result = updateEntryTeamWithTotalAmount(entry_teams, allList);

            const entryTeams = result.map((obj) => {
                const rate = obj.hourly_rate != null ? `$${obj.hourly_rate}` : '';
                return {
                    ...obj,
                    hourly_rate: rate,
                };
            });

            let promoters = event_promoters
                .filter((obj) => obj.member_name) // Filter out objects without member_name (id) property
                .map((obj) => {
                    obj.total_earned =
                        obj.male_comp_guest_attended * male_comp_guest_rate +
                        obj.female_comp_guest_attended * female_comp_guest_rate +
                        obj.table_guest_attended * table_guest_rate;
                    const rate = obj.total_earned > 0 && obj.total_earned != null ? `$${obj.total_earned}` : '';
                    const guest_attended = obj.table_guest_attended > 0 && obj.table_guest_attended != null ? obj.table_guest_attended : '';
                    const male_comp_guest_attended =
                        obj.male_comp_guest_attended > 0 && obj.male_comp_guest_attended != null ? obj.male_comp_guest_attended : '';
                    const female_comp_guest_attended =
                        obj.female_comp_guest_attended > 0 && obj.female_comp_guest_attended != null ? obj.female_comp_guest_attended : '';
                    return {
                        ...obj,
                        total_earned: rate,
                        table_guest_attended: guest_attended,
                        male_comp_guest_attended: male_comp_guest_attended,
                        female_comp_guest_attended: female_comp_guest_attended,
                    };
                });

            let performers = event_performers
                .filter((obj) => obj.performer != null) // Filter out objects with performer id as null
                .map((obj) => {
                    const rate = obj.set_rate != null ? `$${obj.set_rate}` : '';
                    return {
                        ...obj,
                        set_rate: rate,
                    };
                });

            if (!Array.isArray(events) || !events.length) {
                return res.status(404).json({ message: 'No DJs found' });
            }
            // First, group the objects by event_name
            const groups = {};
            events.forEach((obj) => {
                if (!groups[obj.id]) {
                    groups[obj.id] = [];
                }
                groups[obj.id].push(obj);
            });
            // Then, format each group
            const output = Object.keys(groups).map((value) => {
                const group = groups[value];
                const set_times_value = group.map((obj) => {
                    let startTime = '';
                    let endTime = '';
                    let start_time = obj.start_time || '';
                    let end_time = obj.end_time || '';
                    let dj = obj.dj_id || '';
                    const dj_name = obj.dj_name || 'None';
                    const set_time_id = obj.set_time_id || 'None';
                    let fee = obj.fee != null ? obj.fee : null;
                    if (fee == 0) {
                        fee = fee.toString();
                    }
                    const dj_email_status = obj.email_status || '';
                    const email_logs_id = obj.logs_id || '';
                    const added_by = obj.added_by || '';
                    const dj_status = obj.dj_status || '';
                    const notes = obj.set_time_notes || '';
                    const paid_status = obj.paid_status;
                    if (start_time || end_time || dj || fee || added_by || notes || dj_status || paid_status) {
                        return { set_time_id, start_time, end_time, dj, fee, added_by, notes, dj_status, paid_status, email_logs_id, dj_email_status };
                    }
                });

                const date_value = group.map((obj) => {
                    return obj.date;
                });
                const start_event_time_value = group.map((obj) => {
                    return obj.start_event_time;
                });

                const end_event_time_value = group.map((obj) => {
                    return obj.end_event_time;
                });

                const id_value = group.map((obj) => {
                    return obj.id;
                });

                const event_name_value = group.map((obj) => {
                    return obj.event_name;
                });

                const venue_id_value = group.map((obj) => {
                    return obj.venue_id;
                });
                const entry_team_id = group.map((obj) => {
                    return obj.entry_team_id;
                });

                const venue_id = venue_id_value.length > 0 ? venue_id_value[0] : '';
                const start_event_time = start_event_time_value.length > 0 ? start_event_time_value[0] : '';
                const end_event_time = end_event_time_value.length > 0 ? end_event_time_value[0] : '';
                const date = date_value.length > 0 ? date_value[0] : '';
                const event_name = event_name_value.length > 0 ? event_name_value[0] : '';
                const id = id_value.length > 0 ? id_value[0] : '';
                let set_times = set_times_value.includes(undefined) ? '' : set_times_value;
                let eb_comp_listed = event_brite_details && event_brite_details[0] ? event_brite_details[0].eb_comp_listed : "";
                let eb_comp_attended = event_brite_details && event_brite_details[0] ? event_brite_details[0].eb_comp_attended : "";
                let eb_paid_listed = event_brite_details && event_brite_details[0] ? event_brite_details[0].eb_paid_listed : "";
                let eb_paid_attended = event_brite_details && event_brite_details[0] ? event_brite_details[0].eb_paid_attended : "";
                return {
                    id,
                    event_name,
                    date,
                    start_event_time,
                    end_event_time,
                    venue_id,
                    eb_comp_listed,
                    eb_comp_attended,
                    eb_paid_listed,
                    eb_paid_attended,
                    set_times,
                    entryTeams,
                    promoters,
                    performers,
                };
            });
            return res.json({ data: output[0] });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }

    static async updateById(req, res, next) {
        try {
            const { id, ...updatedDetails } = req.body;
            if (!id) {
                throw new Error('ID is required');
            }
            updatedDetails.user_id = req.user.id;
            await Events.updateeventDetails(id, updatedDetails);

            const updatedEvent = await Events.getEventById(id);
            return res.json(updatedEvent);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async deleteById(req, res, next) {
        try {
            let response = await Events.findOne(req.params.id);
            let oldData = JSON.stringify(response)
            const sql = `INSERT INTO deleted_records(record_id, data)VALUES(?, ?)`;
            const activity_values = [response[0].id, oldData];
            const [activityResults] = await pool.query(sql, activity_values);

            let results = await Events.getDJHistoryByEvent(req.params.id);
            let promoterResult = await Events.getPromoterHistoryByEvent(req.params.id);
            await Events.deleteeventDetails(req.params.id);
            await Promoter.updatePromotersHistory(promoterResult);

            const event_id = req.params.id;
            const user_id = req.user.id;
            let current_date = new Date();
            let current_utc_date_string2 = current_date.toISOString();
            const deleteSql = `INSERT INTO activities(action, actor, table_name, record_id, event_id, date_time)VALUES(?, ?, ?, ?, ?, ?)`;
            const values = ['delete', user_id, 'event', event_id, event_id, current_utc_date_string2];
            await pool.query(deleteSql, values);

            if (results.length > 0) {
                results.forEach(async (dj) => {
                    try {
                        const sql = `SELECT ROUND(AVG(listed)) AS avg_listed, ROUND(AVG(attended)) AS avg_attended, AVG(conversion_rate) AS avg_conversion_rate FROM ( SELECT id, dj_id, event_id,listed, attended, attended/listed * 100 AS conversion_rate FROM dj_guests_history WHERE dj_id = '${dj.dj_id}' ORDER BY attended DESC LIMIT 2) AS subquery;`;
                        const [results] = await pool.query(sql);
                        if (results.length > 0) {
                            let avg_listed = results[0].avg_listed ? parseInt(results[0].avg_listed) : null;
                            let avg_attended = results[0].avg_attended ? parseInt(results[0].avg_attended) : null;
                            let avg_conversion_rate = results[0].avg_conversion_rate ? results[0].avg_conversion_rate : null;
                            avg_conversion_rate = Number(avg_conversion_rate).toFixed(1);
                            const queryString = `UPDATE djs SET total_is = ${avg_listed}, total_in = ${avg_attended}, conversion_rate = ${avg_conversion_rate} WHERE id = ${dj.dj_id};`;
                            await pool.query(queryString);
                        }
                        DjsController.rankDjs(results, dj.dj_id);
                        return;
                    } catch (error) {
                        console.error(error);
                        throw new Error('An error occurred while executing the query.');
                    }

                });
            }

            return res.json({ message: 'Event details deleted successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: error.message });
        }
    }

    static async assignDj(req, res, next) {
        try {
            const { timeset_id , dj_id, email, set_type } = req.body;
            if (!timeset_id || timeset_id =='') {
                return res.status(400).json({ message: 'DJ or Timeset is required' });
            }
            let user_id = req.user.id;
            req.body.user_id = user_id;
            await Events.assignDjtoEvent(req.body);
            const djDetail = await Djs.getDjById(dj_id);
            const timeSetDetails = await Djs.getTimesetByDj(timeset_id);
            let startTime = '';
            let endTime = '';
            let djFee = '';
            let venueName = '';
            let formattedDate = '';
            let day = '';
            let event_id ;
            if (timeSetDetails.length >0) {
                event_id = timeSetDetails[0].event_id;
                venueName = timeSetDetails[0].venue_name;
                djFee = timeSetDetails[0].dj_fee;

                const date = moment(timeSetDetails[0].date).utc();
                formattedDate = date.format('dddd MMMM D, YYYY');
                day = date.format('dddd');
                /*startTime formating*/
                if (timeSetDetails[0].start_time != null) {
                  let start_time_array = timeSetDetails[0].start_time.split(':');
                  let start_hour = start_time_array[0] % 12;
                  start_hour = start_hour || 12; // the hour '0' should be '12
                  let am_pm = start_time_array[0] < 12 ? 'AM' : 'PM';
                  start_time_array[0] = start_hour;
                  let formatted_time = start_time_array.join(':') + ' ' + am_pm;
                  startTime = formatted_time;
                }
                /*endTime formating*/
                if (timeSetDetails[0].start_time != null) {
                  let end_time_array = timeSetDetails[0].end_time.split(':');
                  let end_hour = end_time_array[0] % 12;
                  end_hour = end_hour || 12; // the hour '0' should be '12
                  let am_pm = end_time_array[0] < 12 ? 'AM' : 'PM';
                  end_time_array[0] = end_hour;
                  let formatted_time = end_time_array.join(':') + ' ' + am_pm;
                  endTime = formatted_time;
                }
            }
            let djName = '';
            let djEmail = '';
            if(djDetail.length> 0){
                djName =djDetail[0].dj_name; 
                djEmail =djDetail[0].email; 
            }
            let templatePath = '';
            let emailContent = '';
            let setValue = '';
            if(venueName.includes('Hard')){
                emailContent = await Emails.getEmailConent('Hard');
                templatePath = '/email-templates/dj-confirmation/hard-rock-email.ejs';
                if(set_type == 1 || set_type == 2 || set_type == 3) {
                    setValue= 'Please be at the venue at least 30 minutes before your set time. More if possible, it is a good way to get to know your crowd before your set. Unless you are the opener, then 11:45 at the stage is fine.'
                } else if(set_type == 0) {
                    setValue= 'Please be at the venue at least 60 minutes before your set time. More if possible, it is a good way to get to know your crowd before your set.'
                }
            } else if(venueName.includes('Lumi')){
                if(set_type == 1 || set_type == 2) {
                    setValue= 'Please be at the venue at least 30 minutes before your set time. More if possible, it is a good way to get to know your crowd before your set. Unless you are the opener, 9:40 pm is fine.';
                } else if(set_type == 0) {
                    setValue= 'Please be at the venue at least 30 minutes before your set time. More if possible, it is a good way to get to know your crowd before your set. Especially for this set time. You have lots of time to come and hang out and socialize with your fans and make new ones.';
                }
                emailContent = await Emails.getEmailConent('Lumi');
                templatePath = '/email-templates/dj-confirmation/lumi-email.ejs';
            }
            if(email && djEmail && djEmail !='' && emailContent.length > 0){
                let emailStatus = await sendEmail({
                    to: djEmail,
                    subject: 'Dj Confirmation',
                    templatePath: templatePath,
                    data: {
                        djFee: djFee,
                        setType: set_type,
                        setValue: setValue,
                        content: emailContent[0],
                        djId: dj_id,
                        timesetId: timeset_id,
                        djName: djName,
                        venueName: venueName,
                        formattedDate: formattedDate,
                        startTime: startTime,
                        endTime: endTime,
                        day: day,
                        venueName: venueName,
                    },
                });

                if(emailStatus) {
                    let current_date = new Date();
                    let current_utc_date_string2 = current_date.toISOString();
                    let emailData = {'event_id': event_id, 'dj_id': dj_id, 'time_set_id':timeset_id, 'status':'sent', 'date_time': current_utc_date_string2}
                    await Events.addEmaiLogs(emailData);
                }
                return res.status(200).json({ message: 'DJ assigned and Email sent successfully' }).end();
            } else if(email && ( !djEmail ||  djEmail =='')) {
                return res.status(200).json({ message: 'DJ Email Does Not Exists' }).end();
            }
            return res.json({ message: 'DJ assigned successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: error.message });
        }
    }

    static async getEventByDj(req, res, next) {
        try {
            const events = await Events.getEventByDj(req.params.id);
            const updatedData = events.map((obj) => {
                const hasListedOrAttended = obj.listed !== null || obj.attended !== null;
                return {
                    ...obj,
                    status: hasListedOrAttended,
                };
            });
            if (!Array.isArray(updatedData) || !updatedData.length) {
                return res.status(404).json({ message: 'No Events found', data: [] });
            }
            return res.json({ data: updatedData });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async getEmailLogs(req, res, next) {
        try {
            const emailLogs = await Events.emailLogs();
            if (!Array.isArray(emailLogs) || !emailLogs.length) {
                return res.status(404).json({ message: 'No email logs found', data: [] });
            }
            for (var i = 0; i < emailLogs.length; i++) {
                emailLogs[i].row = i + 1;

                let startTime = '';
                let endTime = '';

                /*startTime formating*/
                if (emailLogs[i].start_time != null) {
                    let start_time_array = emailLogs[i].start_time.split(':');
                    let start_hour = start_time_array[0] % 12;
                    start_hour = start_hour || 12; // the hour '0' should be '12
                    let am_pm = start_time_array[0] < 12 ? 'AM' : 'PM';
                    start_time_array[0] = start_hour;
                    let formatted_time = start_time_array.join(':') + ' ' + am_pm;
                    startTime = formatted_time;
                }

                /*endTime formating*/
                if (emailLogs[i].start_time != null) {
                    let end_time_array = emailLogs[i].end_time.split(':');
                    let end_hour = end_time_array[0] % 12;
                    end_hour = end_hour || 12; // the hour '0' should be '12
                    let am_pm = end_time_array[0] < 12 ? 'AM' : 'PM';
                    end_time_array[0] = end_hour;
                    let formatted_time = end_time_array.join(':') + ' ' + am_pm;
                    endTime = formatted_time;
                }

                emailLogs[i].set_time_value = startTime + '-' + endTime;
            }

            return res.json({ data: emailLogs });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async updateCreativeStatus(req, res, next) {
        try {
            let event_id = req.params.id;
            let type = req.params.type;
            let status = req.params.status;
            let user_id  = req.user.id;
            const currentDate = new Date();
            const utcDate = currentDate.toISOString();
            const formattedDate = utcDate.slice(0, 10) + ' ' + utcDate.slice(11, 19);
            const events = await Events.setCreativeStatus(event_id, req.params.type, formattedDate, status, user_id);
            let creativeRequestData = '';
            if (type == 'sent') {
                creativeRequestData = { id: event_id, creative_sent_date: formattedDate };
            } else if ('recieved') {
                creativeRequestData = { id: event_id, creative_recieved_date: formattedDate };
            }
            return res.json({ data: creativeRequestData });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async uploadCreativeDesigns(req, res, next) {
        try {
            // console.log(req.files)
            console.log(req.body.eventId);
            
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).send('No files were uploaded.');
            }

            let creative = req.files.file;
            const eventId = req.body.eventId
            const uniqueFilename = Date.now() + '-' + creative.name;
            creative.mv('./uploads/' + uniqueFilename);
            const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
            const filePath = path.join(uploadsDir, uniqueFilename);
            console.log(uniqueFilename)
            const events = await Events.saveCreativeDesign(eventId, uniqueFilename);
            // creative_design_file

            return res.json({ filePath: uniqueFilename });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async sendCreativeEmail(req, res, next) {
        try {
            
            console.log(req.body);

            const eventId = req.body.event_id
            const Djs = req.body.Djs
            const Promoters = req.body.promoters
            const assistants = req.body.assistants
            let Djresult = await Events.getDJEmailsByEvent(Djs, eventId)
            let Promoterresult = await Events.getPromoterEmailsByEvent(Promoters, eventId)
            let Userresult = await Events.getUsersByIds(assistants)
            let imageRes = await Events.getEventDesign(eventId)
            if (!Array.isArray(imageRes) || !imageRes.length) {
                return res.status(404).json({ message: 'No file was found', data: [] });
            }
            let imagePath  = imageRes[0].creative_design_file
            imagePath = 'http://ec2-52-40-195-176.us-west-2.compute.amazonaws.com/dj/uploads/'+ imagePath
            let emailContent = await Emails.getEmailConent('Creative');
            await EventsController.sendCreativeDesignEmails(Djresult, 'Djs', imagePath, emailContent);
            await EventsController.sendCreativeDesignEmails(Promoterresult, 'promoters', imagePath, emailContent);
            await EventsController.sendCreativeDesignEmails(Userresult, 'users', imagePath, emailContent);
            // Creating Email Logs
            let currentDate = new Date();
            let current_utc_date_string2 = currentDate.toISOString();
            const utcDate = currentDate.toISOString();
            const formattedDate = utcDate.slice(0, 10) + ' ' + utcDate.slice(11, 19);
            await Events.setCreativeStatus(eventId, 'recieved', formattedDate, 1);
            await Events.setCreativeEmailTime(eventId, current_utc_date_string2);

            return res.json({ image: imageRes });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static async sendCreativeDesignEmails(result, type, imagePath, emailContent) {
        try {
            let i;
            for(i=0;i < result.length ; i++){
                console.log(result[i]);
                if(result[i].email && result[i].email !=''){
                    let emailStatus = await sendEmail({
                        to: result[i].email,
                        subject: 'Creative Design',
                        templatePath: '/email-templates/creative-email/index.ejs',
                        data: {
                            content:emailContent[0],
                            image: imagePath
                        },
                    });
                    await Events.updateCreativeEmailStatus(result[i].id, type, 1)
                } else{
                    await Events.updateCreativeEmailStatus(result[i].id, type, 0)
                }
            }
        } catch (error) {
            console.error(error);
            // return res.status(400).json({ message: error.message });
        }
    }

    static async getCreativeDesign(req, res, next) {
        try {
            let eventId = req.params.id;
            let response = await Events.getEventDesign(eventId)
            let DjsData = await Djs.getDjByEvent(eventId);
            let PromotersData = await Promoter.getPromoterByEvent(eventId);
            let UsersData = await Users.getUsersByRole();
            if (!Array.isArray(response) || !response.length) {
                return res.status(404).json({ message: 'No Image found', data: [] });
            }
            return res.json({ image: response[0], Djs: DjsData, Promoters:PromotersData, Users: UsersData });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    

    static async updateEmailStatus(req, res, next) {
        try {

            console.log('testing email confirmation feature');
            const events = await Events.changeEmailStatus(req.params.id, req.params.timeSetId);

            if (!Array.isArray(events) || !events.length) {
                return res.status(404).json({ message: 'No Events found', data: [] });
            }

            return res.json({ data: events });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    
    static async listRankwise(req, res, next) {
        try {
            const djs = await Events.listAllEventDjs(req.params.id);
            const promoters = await Events.listAllEventPromoters(req.params.id);
            const eventBriteDetails = await Events.getEventBriteById(req.params.id);

            // if (!djs.length && !promoters.length && !eventBriteDetails.length) {
            //     return res.status(404).json({ message: 'No record found' });
            // }

            let totalListedGuest = 0;
            let totalAttendedGuest = 0;

            promoters.forEach((obj) => {
                const { guest_listed, comp_listed, guest_attended, comp_attended } = obj;
                obj.type = "promoter"
                if (guest_listed) {
                    totalListedGuest += parseInt(guest_listed);
                    obj.total_is = parseInt(guest_listed) + parseInt(comp_listed);
                }
                if (comp_listed) {
                    totalListedGuest += parseInt(comp_listed);
                    obj.total_is = parseInt(guest_listed) + parseInt(comp_listed);
                }

                if (guest_attended) {
                    totalAttendedGuest += parseInt(guest_attended);
                    obj.total_in = parseInt(guest_attended) + parseInt(comp_attended);
                }
                if (comp_attended) {
                    totalAttendedGuest += parseInt(comp_attended);
                    obj.total_in = parseInt(guest_attended) + parseInt(comp_attended);
                }

                obj.conversion_rate =
                    obj.total_in > 0 && obj.total_is > 0
                        ? ((obj.total_in / obj.total_is) * 100).toFixed(2)
                        : '';
            });

            if (promoters.length > 0) {
                promoters.push({
                    dj_name: 'Promoters Total',
                    total_is: totalListedGuest || '',
                    total_in: totalAttendedGuest || '',
                    conversion_rate:
                        totalAttendedGuest > 0 && totalListedGuest > 0
                            ? ((totalAttendedGuest / totalListedGuest) * 100).toFixed(2)
                            : '',
                });
            }
            if(promoters.length<1){
                promoters.unshift({
                    dj_name: '',
                    total_in: '',
                    total_is: '',
                    conversion_rate: '',
                });
            }
            promoters.unshift({
                dj_name: 'Promoters',
                total_in: '',
                total_is: '',
                conversion_rate: '',
                type:"add_promoters"
            });


            const { totalListedSum, totalAttendedSum } = djs.reduce(
                (acc, dj) => {
                    dj.type = "djs"
                    if (dj.total_is !== null && dj.total_in !== null && dj.total_is !== '' && dj.total_in !== '') {
                        const totalListed = parseInt(dj.total_is);
                        const totalAttended = parseInt(dj.total_in);
                        dj.conversion_rate = ((totalAttended / totalListed) * 100).toFixed(2);
                        acc.totalListedSum += totalListed;
                        acc.totalAttendedSum += totalAttended;
                    }
                    return acc;
                },
                { totalListedSum: 0, totalAttendedSum: 0 }
            );

            if (djs.length > 0) {
                djs.push({
                    dj_name
                        : 'Djs Total',
                    total_is: totalListedSum || '',
                    total_in: totalAttendedSum || '',
                    conversion_rate:
                        totalAttendedSum > 0 && totalListedSum > 0
                            ? ((totalAttendedSum / totalListedSum) * 100).toFixed(2)
                            : '',
                });
            }
            if(djs.length<1){
                djs.unshift({
                    total_in: '',
                    total_is: '',
                    conversion_rate: '',
                    dj_name: '',
                });
            }
            djs.unshift({
                total_in: '',
                total_is: '',
                conversion_rate: '',
                dj_name: 'Djs',
            });
            let ebTotalListed = 0;
            let ebTotalAttended = 0;
            let newDetails = [{ dj_name: 'EB', total_in: '', total_is: '', conversion_rate: '', type:"eventBrite"},];

            if (eventBriteDetails.length > 0) {
                const { eb_comp_listed, eb_paid_listed, eb_comp_attended, eb_paid_attended } = eventBriteDetails[0];

                ebTotalListed = eb_comp_listed && eb_paid_listed ? parseInt(eb_comp_listed) + parseInt(eb_paid_listed) : '';
                ebTotalAttended = eb_comp_attended && eb_paid_attended ? parseInt(eb_comp_attended) + parseInt(eb_paid_attended) : '';
                if (eb_comp_attended || eb_comp_listed) {
                    newDetails.push({
                        dj_name: 'EB Comp',
                        total_in: eb_comp_attended || '',
                        total_is: eb_comp_listed || '',
                        conversion_rate: ((parseInt(eb_comp_attended) / parseInt(eb_comp_listed)) * 100).toFixed(2),
                        
                    });
                }
                if (eb_paid_attended || eb_paid_listed) {
                    newDetails.push({
                        dj_name: 'EB Paid',
                        total_in: eb_paid_attended || '',
                        total_is: eb_paid_listed || '',
                        conversion_rate: ((parseInt(eb_paid_attended) / parseInt(eb_paid_listed)) * 100).toFixed(2),
                        
                    });
                }
                
                if (ebTotalAttended || ebTotalListed) {
                    newDetails.push({
                        dj_name: 'EB Total',
                        total_in: ebTotalAttended || '',
                        total_is: ebTotalListed || '',
                        conversion_rate: ((parseInt(ebTotalAttended) / parseInt(ebTotalListed)) * 100).toFixed(2),
                    });
                }
            }
            newDetails.push({
                dj_name: '',
                total_in: '',
                total_is: '',
                conversion_rate: ''
            })
            let overAllTotalListed = totalListedGuest + totalListedSum + ebTotalListed;
            let overAllTotalAttended = totalAttendedGuest + totalAttendedSum + ebTotalAttended;

            let combinedData = [...promoters, ...djs, ...newDetails];
            let finalCalculation = {
                total_is: overAllTotalListed && overAllTotalListed > 0 ? overAllTotalListed : '',
                total_in: overAllTotalAttended && overAllTotalAttended > 0 ? overAllTotalAttended : '',
                dj_name: 'Total',
                conversion_rate:
                    overAllTotalAttended > 0 && overAllTotalListed > 0
                        ? ((overAllTotalAttended / overAllTotalListed) * 100).toFixed(2)
                        : '',
            };

            combinedData.push(finalCalculation);
            combinedData.forEach(obj => {
                if (!obj.conversion_rate || isNaN(obj.conversion_rate)) {
                    obj.conversion_rate = '';
                }
            });
            return res.json({ data: combinedData });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message });
        }
    }
    static async updateEventBrite(req, res, next) {
        try {
            const { id, ...updatedDetails } = req.body;
            if (!id) {
                throw new Error('ID is required');
            }
            await Events.updateEventBrite(id, updatedDetails);
            return res.json({data: 'success'});
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async getEventBritDetails(req, res, next) {
        try {
            const id = req.params.id;
            if (!id) {
                throw new Error('ID is required');
            }
            let data = await Events.getEventBriteById(id);
            return res.json({data: data[0]});
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async getOneEventById(req, res, next) {
        try {
            const id = req.params.id;
            if (!id) {
                throw new Error('ID is required');
            }
            let data = await Events.findOne(id);
            return res.json({ data: data });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

}

export default EventsController;
