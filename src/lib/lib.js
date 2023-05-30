import moment from 'moment/moment.js';

// Function to format time
const formatTime = (time) => {
  if (time) {
    let formatedTime = time.split(':');
    let start_hour = formatedTime[0] % 12;
    start_hour = start_hour || 12; // the hour '0' should be '12
    let am_pm = formatedTime[0] < 12 ? 'AM' : 'PM';
    formatedTime[0] = start_hour;
    let formatted_time = formatedTime.join(':') + ' ' + am_pm;
    let startTime = formatted_time;
    return startTime;
  }
};

export const getDifference = (oldData, newData) => {
  try {
    const differences = [];
      for (const key in newData) {
        if (key === 'date') {
          const oldDate = moment.utc(oldData[0][key]).format('YYYY-MM-DD');
          const newDate = moment.utc(newData[key]).format('YYYY-MM-DD');
          if (oldDate !== newDate) {
            differences.push({
              field_name: key,
              old_value: oldDate,
              new_value: newDate
            });
          }
        } else if (key === 'start_event_time' || key === 'end_event_time' || key === 'start_time' || key=== 'end_time') {
          if (oldData[0][key] !== newData[key]) {
            differences.push({
              field_name: key,
              old_value: formatTime(oldData[0][key]),
              new_value: formatTime(newData[key])
            });
          }
        } else if (oldData[0][key] !== newData[key]) {
            differences.push({
              field_name: key,
              old_value: oldData[0][key],
              new_value: newData[key]
            });
          }
        }
      return differences;
  } catch (error) {
    console.log(error)
    return {};
  }
};

