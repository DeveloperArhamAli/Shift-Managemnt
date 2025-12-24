// utils/timeFormatter.js - Create this helper file
const formatTo12Hour = (time24) => {
    if (!time24 || !time24.includes(':')) return time24;
    
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    
    return {
        time24: time24,
        time12: `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`,
        hours: hours12,
        minutes: minutes,
        period: period
    };
};

const formatShiftTime = (shift) => {
    if (!shift) return shift;
    
    const formattedShift = {
        ...shift._doc ? shift._doc : shift,
        startTime12Hour: formatTo12Hour(shift.startTime).time12,
        endTime12Hour: formatTo12Hour(shift.endTime).time12,
        displayTime: `${formatTo12Hour(shift.startTime).time12} - ${formatTo12Hour(shift.endTime).time12}`,
    };

    return formattedShift;
};

const convertTo12HourFormat = (startTime, endTime) => {
    const startHour = typeof startTime === 'string' ? parseInt(startTime.split(':')[0]) : parseInt(startTime[0]);
    const startMinute = typeof startTime === 'string' ? startTime.split(':')[1] : startTime[1];
    
    const endHour = typeof endTime === 'string' ? parseInt(endTime.split(':')[0]) : parseInt(endTime[0]);
    const endMinute = typeof endTime === 'string' ? endTime.split(':')[1] : endTime[1];
    
    let startHour12 = startHour % 12;
    if (startHour12 === 0) startHour12 = 12; // Handle 0 becomes 12 for 12 AM/PM
    const startPeriod = startHour >= 12 ? 'PM' : 'AM';
    const startTime12Hour = `${startHour12}:${startMinute.padStart(2, '0')} ${startPeriod}`;
    
    let endHour12 = endHour % 12;
    if (endHour12 === 0) endHour12 = 12; // Handle 0 becomes 12 for 12 AM/PM
    const endPeriod = endHour >= 12 ? 'PM' : 'AM';
    const endTime12Hour = `${endHour12}:${endMinute.padStart(2, '0')} ${endPeriod}`;
    
    return { startTime12Hour, endTime12Hour };
}

module.exports = { formatTo12Hour, formatShiftTime, convertTo12HourFormat };