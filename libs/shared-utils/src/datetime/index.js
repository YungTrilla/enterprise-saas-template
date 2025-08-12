'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.parseDate = parseDate;
exports.createDate = createDate;
exports.getCurrentTimestamp = getCurrentTimestamp;
exports.getCurrentDate = getCurrentDate;
exports.toISOString = toISOString;
exports.isValidDate = isValidDate;
exports.isDateInPast = isDateInPast;
exports.isDateInFuture = isDateInFuture;
exports.isToday = isToday;
exports.datesOverlap = datesOverlap;
exports.isDateInRange = isDateInRange;
exports.addBusinessDays = addBusinessDays;
exports.getBusinessDaysBetween = getBusinessDaysBetween;
exports.getAge = getAge;
exports.getDuration = getDuration;
exports.getDateRange = getDateRange;
exports.generateDateRange = generateDateRange;
exports.getDateBounds = getDateBounds;
exports.getUserTimezone = getUserTimezone;
exports.toUserTimezone = toUserTimezone;
exports.getTimezoneOffset = getTimezoneOffset;
exports.isBusinessDay = isBusinessDay;
exports.getNextBusinessDay = getNextBusinessDay;
exports.getPreviousBusinessDay = getPreviousBusinessDay;
exports.isUSHoliday = isUSHoliday;
exports.formatDuration = formatDuration;
exports.generateTimeSlots = generateTimeSlots;
exports.isWithinBusinessHours = isWithinBusinessHours;
const date_fns_1 = require('date-fns');
// ========================================
// Date Creation and Parsing
// ========================================
/**
 * Safely parse date string to Date object
 */
function parseDate(dateString) {
  if (typeof dateString !== 'string') return null;
  try {
    const date = (0, date_fns_1.parseISO)(dateString);
    return (0, date_fns_1.isValid)(date) ? date : null;
  } catch (error) {
    return null;
  }
}
/**
 * Create date from components
 */
function createDate(year, month, day, hour = 0, minute = 0, second = 0) {
  return new Date(year, month - 1, day, hour, minute, second);
}
/**
 * Get current timestamp in ISO format
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}
/**
 * Get current date without time
 */
function getCurrentDate() {
  return (0, date_fns_1.startOfDay)(new Date());
}
/**
 * Convert Date to ISO string safely
 */
function toISOString(date) {
  if (!date) return null;
  try {
    const dateObj = typeof date === 'string' ? parseDate(date) : date;
    return dateObj?.toISOString() || null;
  } catch (error) {
    return null;
  }
}
// ========================================
// Date Validation and Comparison
// ========================================
/**
 * Check if date is valid
 */
function isValidDate(date) {
  if (!date) return false;
  if (typeof date === 'string') {
    const parsed = parseDate(date);
    return parsed !== null;
  }
  return date instanceof Date && (0, date_fns_1.isValid)(date);
}
/**
 * Check if date is in the past
 */
function isDateInPast(date) {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return false;
  return (0, date_fns_1.isBefore)(dateObj, new Date());
}
/**
 * Check if date is in the future
 */
function isDateInFuture(date) {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return false;
  return (0, date_fns_1.isAfter)(dateObj, new Date());
}
/**
 * Check if date is today
 */
function isToday(date) {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return false;
  return (0, date_fns_1.isSameDay)(dateObj, new Date());
}
/**
 * Check if two dates overlap (for reservations/bookings)
 */
function datesOverlap(start1, end1, start2, end2) {
  const s1 = typeof start1 === 'string' ? parseDate(start1) : start1;
  const e1 = typeof end1 === 'string' ? parseDate(end1) : end1;
  const s2 = typeof start2 === 'string' ? parseDate(start2) : start2;
  const e2 = typeof end2 === 'string' ? parseDate(end2) : end2;
  if (!s1 || !e1 || !s2 || !e2) return false;
  return (0, date_fns_1.isBefore)(s1, e2) && (0, date_fns_1.isAfter)(e1, s2);
}
/**
 * Check if date is within range
 */
function isDateInRange(date, startDate, endDate) {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;
  if (!d || !start || !end) return false;
  return (
    ((0, date_fns_1.isAfter)(d, start) || (0, date_fns_1.isSameDay)(d, start)) &&
    ((0, date_fns_1.isBefore)(d, end) || (0, date_fns_1.isSameDay)(d, end))
  );
}
// ========================================
// Date Calculations
// ========================================
/**
 * Add business days (excluding weekends)
 */
function addBusinessDays(date, days) {
  const startDate = typeof date === 'string' ? parseDate(date) : date;
  if (!startDate) return null;
  let currentDate = new Date(startDate);
  let remainingDays = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;
  while (remainingDays > 0) {
    currentDate = (0, date_fns_1.addDays)(currentDate, direction);
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (!(0, date_fns_1.isWeekend)(currentDate)) {
      remainingDays--;
    }
  }
  return currentDate;
}
/**
 * Calculate business days between two dates
 */
function getBusinessDaysBetween(startDate, endDate) {
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;
  if (!start || !end) return 0;
  const days = (0, date_fns_1.eachDayOfInterval)({ start, end });
  return days.filter(day => !(0, date_fns_1.isWeekend)(day)).length;
}
/**
 * Get age from birth date
 */
function getAge(birthDate) {
  const birth = typeof birthDate === 'string' ? parseDate(birthDate) : birthDate;
  if (!birth) return 0;
  const today = new Date();
  const birthThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  let age = today.getFullYear() - birth.getFullYear();
  if ((0, date_fns_1.isBefore)(today, birthThisYear)) {
    age--;
  }
  return age;
}
/**
 * Get duration between two dates in different units
 */
function getDuration(startDate, endDate, unit = 'days') {
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;
  if (!start || !end) return 0;
  switch (unit) {
    case 'minutes':
      return (0, date_fns_1.differenceInMinutes)(end, start);
    case 'hours':
      return (0, date_fns_1.differenceInHours)(end, start);
    case 'days':
    default:
      return (0, date_fns_1.differenceInDays)(end, start);
  }
}
// ========================================
// Date Range Utilities
// ========================================
/**
 * Get date range for common periods
 */
function getDateRange(period) {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: (0, date_fns_1.startOfDay)(now), end: (0, date_fns_1.endOfDay)(now) };
    case 'yesterday':
      const yesterday = (0, date_fns_1.subDays)(now, 1);
      return {
        start: (0, date_fns_1.startOfDay)(yesterday),
        end: (0, date_fns_1.endOfDay)(yesterday),
      };
    case 'thisWeek':
      return { start: (0, date_fns_1.startOfWeek)(now), end: (0, date_fns_1.endOfWeek)(now) };
    case 'lastWeek':
      const lastWeek = (0, date_fns_1.subWeeks)(now, 1);
      return {
        start: (0, date_fns_1.startOfWeek)(lastWeek),
        end: (0, date_fns_1.endOfWeek)(lastWeek),
      };
    case 'thisMonth':
      return { start: (0, date_fns_1.startOfMonth)(now), end: (0, date_fns_1.endOfMonth)(now) };
    case 'lastMonth':
      const lastMonth = (0, date_fns_1.subMonths)(now, 1);
      return {
        start: (0, date_fns_1.startOfMonth)(lastMonth),
        end: (0, date_fns_1.endOfMonth)(lastMonth),
      };
    case 'thisYear':
      return { start: (0, date_fns_1.startOfYear)(now), end: (0, date_fns_1.endOfYear)(now) };
    case 'lastYear':
      const lastYear = (0, date_fns_1.subYears)(now, 1);
      return {
        start: (0, date_fns_1.startOfYear)(lastYear),
        end: (0, date_fns_1.endOfYear)(lastYear),
      };
    default:
      return { start: (0, date_fns_1.startOfDay)(now), end: (0, date_fns_1.endOfDay)(now) };
  }
}
/**
 * Generate date range array
 */
function generateDateRange(startDate, endDate, interval = 'day') {
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;
  if (!start || !end) return [];
  switch (interval) {
    case 'week':
      return (0, date_fns_1.eachWeekOfInterval)({ start, end });
    case 'month':
      return (0, date_fns_1.eachMonthOfInterval)({ start, end });
    case 'day':
    default:
      return (0, date_fns_1.eachDayOfInterval)({ start, end });
  }
}
/**
 * Get the earliest and latest dates from an array
 */
function getDateBounds(dates) {
  const validDates = dates
    .map(date => (typeof date === 'string' ? parseDate(date) : date))
    .filter(date => date !== null);
  if (validDates.length === 0) {
    return { min: null, max: null };
  }
  return {
    min: (0, date_fns_1.min)(validDates),
    max: (0, date_fns_1.max)(validDates),
  };
}
// ========================================
// Timezone Utilities
// ========================================
/**
 * Get user's timezone
 */
function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
/**
 * Convert date to user's timezone
 */
function toUserTimezone(date, timezone) {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return new Date();
  const tz = timezone || getUserTimezone();
  // Create a new date adjusted for timezone
  const utcTime = dateObj.getTime() + dateObj.getTimezoneOffset() * 60000;
  const targetTime = new Date(utcTime + getTimezoneOffset(tz) * 60000);
  return targetTime;
}
/**
 * Get timezone offset in minutes
 */
function getTimezoneOffset(timezone) {
  try {
    const now = new Date();
    const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const target = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return (utc.getTime() - target.getTime()) / (1000 * 60);
  } catch (error) {
    return 0;
  }
}
// ========================================
// Business Calendar Utilities
// ========================================
/**
 * Check if date is a business day (not weekend)
 */
function isBusinessDay(date) {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return false;
  return !(0, date_fns_1.isWeekend)(dateObj);
}
/**
 * Get next business day
 */
function getNextBusinessDay(date) {
  const startDate = typeof date === 'string' ? parseDate(date) : date;
  if (!startDate) return null;
  let nextDay = (0, date_fns_1.addDays)(startDate, 1);
  while ((0, date_fns_1.isWeekend)(nextDay)) {
    nextDay = (0, date_fns_1.addDays)(nextDay, 1);
  }
  return nextDay;
}
/**
 * Get previous business day
 */
function getPreviousBusinessDay(date) {
  const startDate = typeof date === 'string' ? parseDate(date) : date;
  if (!startDate) return null;
  let prevDay = (0, date_fns_1.subDays)(startDate, 1);
  while ((0, date_fns_1.isWeekend)(prevDay)) {
    prevDay = (0, date_fns_1.subDays)(prevDay, 1);
  }
  return prevDay;
}
/**
 * Check for common US holidays (basic implementation)
 */
function isUSHoliday(date) {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return false;
  const month = dateObj.getMonth() + 1; // 1-based month
  const day = dateObj.getDate();
  // New Year's Day
  if (month === 1 && day === 1) return true;
  // Independence Day
  if (month === 7 && day === 4) return true;
  // Christmas Day
  if (month === 12 && day === 25) return true;
  // Add more holidays as needed
  return false;
}
// ========================================
// Time Formatting Utilities
// ========================================
/**
 * Format duration in human readable format
 */
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    if (remainingMinutes === 0) {
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) {
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  return `${days}d ${remainingHours}h`;
}
/**
 * Create time slots for scheduling
 */
function generateTimeSlots(startTime, endTime, intervalMinutes = 30) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  for (let minutes = startMinutes; minutes < endMinutes; minutes += intervalMinutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    slots.push(timeString);
  }
  return slots;
}
/**
 * Check if time is within business hours
 */
function isWithinBusinessHours(time, businessHours = { start: '09:00', end: '17:00' }) {
  const timeObj = typeof time === 'string' ? parseDate(time) : time;
  if (!timeObj) return false;
  const timeString = (0, date_fns_1.format)(timeObj, 'HH:mm');
  return timeString >= businessHours.start && timeString <= businessHours.end;
}
