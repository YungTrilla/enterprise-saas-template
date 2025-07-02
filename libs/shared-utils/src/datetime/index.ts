import {
  format,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isAfter,
  isBefore,
  isSameDay,
  isWeekend,
  getDay,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  max as maxDate,
  min as minDate,
} from 'date-fns';

// ========================================
// Date Creation and Parsing
// ========================================

/**
 * Safely parse date string to Date object
 */
export function parseDate(dateString: string): Date | null {
  if (typeof dateString !== 'string') return null;
  
  try {
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  } catch (error) {
    return null;
  }
}

/**
 * Create date from components
 */
export function createDate(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): Date {
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get current date without time
 */
export function getCurrentDate(): Date {
  return startOfDay(new Date());
}

/**
 * Convert Date to ISO string safely
 */
export function toISOString(date: Date | string | null): string | null {
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
export function isValidDate(date: any): boolean {
  if (!date) return false;
  
  if (typeof date === 'string') {
    const parsed = parseDate(date);
    return parsed !== null;
  }
  
  return date instanceof Date && isValid(date);
}

/**
 * Check if date is in the past
 */
export function isDateInPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return false;
  
  return isBefore(dateObj, new Date());
}

/**
 * Check if date is in the future
 */
export function isDateInFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return false;
  
  return isAfter(dateObj, new Date());
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return false;
  
  return isSameDay(dateObj, new Date());
}

/**
 * Check if two dates overlap (for reservations/bookings)
 */
export function datesOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = typeof start1 === 'string' ? parseDate(start1) : start1;
  const e1 = typeof end1 === 'string' ? parseDate(end1) : end1;
  const s2 = typeof start2 === 'string' ? parseDate(start2) : start2;
  const e2 = typeof end2 === 'string' ? parseDate(end2) : end2;
  
  if (!s1 || !e1 || !s2 || !e2) return false;
  
  return isBefore(s1, e2) && isAfter(e1, s2);
}

/**
 * Check if date is within range
 */
export function isDateInRange(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;
  
  if (!d || !start || !end) return false;
  
  return (isAfter(d, start) || isSameDay(d, start)) && 
         (isBefore(d, end) || isSameDay(d, end));
}

// ========================================
// Date Calculations
// ========================================

/**
 * Add business days (excluding weekends)
 */
export function addBusinessDays(date: Date | string, days: number): Date | null {
  const startDate = typeof date === 'string' ? parseDate(date) : date;
  if (!startDate) return null;
  
  let currentDate = new Date(startDate);
  let remainingDays = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;
  
  while (remainingDays > 0) {
    currentDate = addDays(currentDate, direction);
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (!isWeekend(currentDate)) {
      remainingDays--;
    }
  }
  
  return currentDate;
}

/**
 * Calculate business days between two dates
 */
export function getBusinessDaysBetween(
  startDate: Date | string,
  endDate: Date | string
): number {
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;
  
  if (!start || !end) return 0;
  
  const days = eachDayOfInterval({ start, end });
  return days.filter(day => !isWeekend(day)).length;
}

/**
 * Get age from birth date
 */
export function getAge(birthDate: Date | string): number {
  const birth = typeof birthDate === 'string' ? parseDate(birthDate) : birthDate;
  if (!birth) return 0;
  
  const today = new Date();
  const birthThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  
  let age = today.getFullYear() - birth.getFullYear();
  
  if (isBefore(today, birthThisYear)) {
    age--;
  }
  
  return age;
}

/**
 * Get duration between two dates in different units
 */
export function getDuration(
  startDate: Date | string,
  endDate: Date | string,
  unit: 'days' | 'hours' | 'minutes' = 'days'
): number {
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;
  
  if (!start || !end) return 0;
  
  switch (unit) {
    case 'minutes':
      return differenceInMinutes(end, start);
    case 'hours':
      return differenceInHours(end, start);
    case 'days':
    default:
      return differenceInDays(end, start);
  }
}

// ========================================
// Date Range Utilities
// ========================================

/**
 * Get date range for common periods
 */
export function getDateRange(period: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    
    case 'thisWeek':
      return { start: startOfWeek(now), end: endOfWeek(now) };
    
    case 'lastWeek':
      const lastWeek = subWeeks(now, 1);
      return { start: startOfWeek(lastWeek), end: endOfWeek(lastWeek) };
    
    case 'thisMonth':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    
    case 'thisYear':
      return { start: startOfYear(now), end: endOfYear(now) };
    
    case 'lastYear':
      const lastYear = subYears(now, 1);
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
    
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

/**
 * Generate date range array
 */
export function generateDateRange(
  startDate: Date | string,
  endDate: Date | string,
  interval: 'day' | 'week' | 'month' = 'day'
): Date[] {
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;
  
  if (!start || !end) return [];
  
  switch (interval) {
    case 'week':
      return eachWeekOfInterval({ start, end });
    case 'month':
      return eachMonthOfInterval({ start, end });
    case 'day':
    default:
      return eachDayOfInterval({ start, end });
  }
}

/**
 * Get the earliest and latest dates from an array
 */
export function getDateBounds(dates: (Date | string)[]): { min: Date | null; max: Date | null } {
  const validDates = dates
    .map(date => typeof date === 'string' ? parseDate(date) : date)
    .filter((date): date is Date => date !== null);
  
  if (validDates.length === 0) {
    return { min: null, max: null };
  }
  
  return {
    min: minDate(validDates),
    max: maxDate(validDates)
  };
}

// ========================================
// Timezone Utilities
// ========================================

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert date to user's timezone
 */
export function toUserTimezone(date: Date | string, timezone?: string): Date {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return new Date();
  
  const tz = timezone || getUserTimezone();
  
  // Create a new date adjusted for timezone
  const utcTime = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  const targetTime = new Date(utcTime + (getTimezoneOffset(tz) * 60000));
  
  return targetTime;
}

/**
 * Get timezone offset in minutes
 */
export function getTimezoneOffset(timezone: string): number {
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
export function isBusinessDay(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return false;
  
  return !isWeekend(dateObj);
}

/**
 * Get next business day
 */
export function getNextBusinessDay(date: Date | string): Date | null {
  const startDate = typeof date === 'string' ? parseDate(date) : date;
  if (!startDate) return null;
  
  let nextDay = addDays(startDate, 1);
  
  while (isWeekend(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  
  return nextDay;
}

/**
 * Get previous business day
 */
export function getPreviousBusinessDay(date: Date | string): Date | null {
  const startDate = typeof date === 'string' ? parseDate(date) : date;
  if (!startDate) return null;
  
  let prevDay = subDays(startDate, 1);
  
  while (isWeekend(prevDay)) {
    prevDay = subDays(prevDay, 1);
  }
  
  return prevDay;
}

/**
 * Check for common US holidays (basic implementation)
 */
export function isUSHoliday(date: Date | string): boolean {
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
export function formatDuration(minutes: number): string {
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
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
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
export function isWithinBusinessHours(
  time: Date | string,
  businessHours: { start: string; end: string } = { start: '09:00', end: '17:00' }
): boolean {
  const timeObj = typeof time === 'string' ? parseDate(time) : time;
  if (!timeObj) return false;
  
  const timeString = format(timeObj, 'HH:mm');
  return timeString >= businessHours.start && timeString <= businessHours.end;
}