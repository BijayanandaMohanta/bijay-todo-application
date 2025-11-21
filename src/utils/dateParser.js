/**
 * Parse date and time from text
 * Detects keywords like "tomorrow", "today", day names, and times
 */

/**
 * Parse date from text
 * @param {string} text - Text to parse
 * @returns {Object} - { date: Date object or null, time: string or null, foundKeywords: array }
 */
export const parseDateTimeFromText = (text) => {
  const lowerText = text.toLowerCase();
  const now = new Date();
  let targetDate = null;
  let targetTime = null;
  const foundKeywords = [];

  // Check for "today"
  if (lowerText.includes('today')) {
    targetDate = new Date(now);
    foundKeywords.push('today');
  }

  // Check for "tomorrow"
  if (lowerText.includes('tomorrow')) {
    targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 1);
    foundKeywords.push('tomorrow');
  }

  // Check for day names (monday, tuesday, etc.)
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = now.getDay();
  
  daysOfWeek.forEach((day, index) => {
    if (lowerText.includes(day)) {
      targetDate = new Date(now);
      let daysToAdd = index - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
      targetDate.setDate(targetDate.getDate() + daysToAdd);
      foundKeywords.push(day);
    }
  });

  // Check for "next week"
  if (lowerText.includes('next week')) {
    targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 7);
    foundKeywords.push('next week');
  }

  // Parse time patterns (e.g., "3pm", "3:30pm", "15:00", "3 pm")
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)/i,  // 3:30pm
    /(\d{1,2})\s*(am|pm)/i,           // 3pm
    /(\d{1,2}):(\d{2})/,              // 15:00 (24hr)
    /at\s+(\d{1,2})/i,                // at 3
  ];

  for (const pattern of timePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      let minutes = match[2] ? parseInt(match[2]) : 0;
      const period = match[3] ? match[3].toLowerCase() : null;

      // Convert to 24-hour format
      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;

      targetTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      foundKeywords.push(`time: ${targetTime}`);
      break;
    }
  }

  // Check for morning/afternoon/evening/night
  if (!targetTime) {
    if (lowerText.includes('morning')) {
      targetTime = '09:00';
      foundKeywords.push('morning (9am)');
    } else if (lowerText.includes('afternoon')) {
      targetTime = '14:00';
      foundKeywords.push('afternoon (2pm)');
    } else if (lowerText.includes('evening')) {
      targetTime = '18:00';
      foundKeywords.push('evening (6pm)');
    } else if (lowerText.includes('night')) {
      targetTime = '20:00';
      foundKeywords.push('night (8pm)');
    }
  }

  return {
    date: targetDate,
    time: targetTime,
    foundKeywords
  };
};

/**
 * Format date for input field (YYYY-MM-DD)
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format time for input field (HH:MM)
 */
export const formatTimeForInput = (time) => {
  if (!time) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  return time;
};

/**
 * Get current date and time formatted for inputs
 */
export const getCurrentDateTime = () => {
  const now = new Date();
  return {
    date: formatDateForInput(now),
    time: formatTimeForInput(null)
  };
};
