/**
 * Convert 24-hour time format to 12-hour format
 * @param {string|number} time24 - Time in 24-hour format
 * @returns {string} Time in 12-hour format (e.g., "2:00 PM")
 */
const formatTo12Hour = (time24) => {
    if (!time24 && time24 !== 0) return '--:--';
    
    // Convert to string
    let timeStr = time24.toString().trim();
    
    // If it's just a number without colon, add ":00"
    if (/^\d{1,2}$/.test(timeStr)) {
        timeStr = timeStr + ':00';
    }
    // If it's a 4-digit number without colon, convert to "HH:MM"
    else if (/^\d{4}$/.test(timeStr)) {
        timeStr = timeStr.substring(0, 2) + ':' + timeStr.substring(2);
    }
    
    let hours, minutes;
    
    // Parse hours and minutes
    if (timeStr.includes(':')) {
        const parts = timeStr.split(':');
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1] || '0', 10);
    } else {
        return timeStr; // Return original if can't parse
    }
    
    // Validate
    if (isNaN(hours) || isNaN(minutes)) {
        return timeStr;
    }
    
    // Normalize hours (0-23)
    hours = hours % 24;
    
    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    let displayHours = hours % 12;
    
    // Handle midnight (0) and noon (12) cases
    if (displayHours === 0) {
        displayHours = 12;
    }
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Format shift timing with next day indication for overnight shifts
 * @param {string} startTime24 - Start time in 24-hour format
 * @param {string} endTime24 - End time in 24-hour format
 * @returns {string} Formatted shift timing
 */
const formatShiftTiming = (startTime24, endTime24) => {
    const start12 = formatTo12Hour(startTime24);
    const end12 = formatTo12Hour(endTime24);
    
    // Parse hours to check if it's overnight
    const parseHours = (timeStr) => {
        if (!timeStr) return 0;
        const str = timeStr.toString();
        let hours = 0;
        
        if (str.includes(':')) {
            hours = parseInt(str.split(':')[0], 10);
        } else if (/^\d{1,2}$/.test(str)) {
            hours = parseInt(str, 10);
        } else if (/^\d{4}$/.test(str)) {
            hours = parseInt(str.substring(0, 2), 10);
        }
        
        return isNaN(hours) ? 0 : hours % 24;
    };
    
    const startHours = parseHours(startTime24);
    const endHours = parseHours(endTime24);
    
    // If end time is less than start time (and end time is not 0/24), it's overnight
    if (endHours < startHours && endHours > 0) {
        return `${start12} - ${end12}`;
    }
    
    return `${start12} - ${end12}`;
};

/**
 * Calculate duration between two times in hours
 * @param {string} startTime - Start time (HH:MM format)
 * @param {string} endTime - End time (HH:MM format)
 * @returns {string} Duration in hours (e.g., "8 hours")
 */
const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '0 hours';
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let start = startHour * 60 + startMin;
    let end = endHour * 60 + endMin;
    
    // Handle overnight shifts
    if (end < start) {
        end += 24 * 60;
    }
    
    const durationHours = (end - start) / 60;
    return `${durationHours} hours`;
};

export { formatTo12Hour, formatShiftTiming, calculateDuration };
export default formatTo12Hour;