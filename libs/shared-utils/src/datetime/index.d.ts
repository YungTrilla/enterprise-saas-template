/**
 * Safely parse date string to Date object
 */
export declare function parseDate(dateString: string): Date | null;
/**
 * Create date from components
 */
export declare function createDate(year: number, month: number, day: number, hour?: number, minute?: number, second?: number): Date;
/**
 * Get current timestamp in ISO format
 */
export declare function getCurrentTimestamp(): string;
/**
 * Get current date without time
 */
export declare function getCurrentDate(): Date;
/**
 * Convert Date to ISO string safely
 */
export declare function toISOString(date: Date | string | null): string | null;
/**
 * Check if date is valid
 */
export declare function isValidDate(date: any): boolean;
/**
 * Check if date is in the past
 */
export declare function isDateInPast(date: Date | string): boolean;
/**
 * Check if date is in the future
 */
export declare function isDateInFuture(date: Date | string): boolean;
/**
 * Check if date is today
 */
export declare function isToday(date: Date | string): boolean;
/**
 * Check if two dates overlap (for reservations/bookings)
 */
export declare function datesOverlap(start1: Date | string, end1: Date | string, start2: Date | string, end2: Date | string): boolean;
/**
 * Check if date is within range
 */
export declare function isDateInRange(date: Date | string, startDate: Date | string, endDate: Date | string): boolean;
/**
 * Add business days (excluding weekends)
 */
export declare function addBusinessDays(date: Date | string, days: number): Date | null;
/**
 * Calculate business days between two dates
 */
export declare function getBusinessDaysBetween(startDate: Date | string, endDate: Date | string): number;
/**
 * Get age from birth date
 */
export declare function getAge(birthDate: Date | string): number;
/**
 * Get duration between two dates in different units
 */
export declare function getDuration(startDate: Date | string, endDate: Date | string, unit?: 'days' | 'hours' | 'minutes'): number;
/**
 * Get date range for common periods
 */
export declare function getDateRange(period: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'): {
    start: Date;
    end: Date;
};
/**
 * Generate date range array
 */
export declare function generateDateRange(startDate: Date | string, endDate: Date | string, interval?: 'day' | 'week' | 'month'): Date[];
/**
 * Get the earliest and latest dates from an array
 */
export declare function getDateBounds(dates: (Date | string)[]): {
    min: Date | null;
    max: Date | null;
};
/**
 * Get user's timezone
 */
export declare function getUserTimezone(): string;
/**
 * Convert date to user's timezone
 */
export declare function toUserTimezone(date: Date | string, timezone?: string): Date;
/**
 * Get timezone offset in minutes
 */
export declare function getTimezoneOffset(timezone: string): number;
/**
 * Check if date is a business day (not weekend)
 */
export declare function isBusinessDay(date: Date | string): boolean;
/**
 * Get next business day
 */
export declare function getNextBusinessDay(date: Date | string): Date | null;
/**
 * Get previous business day
 */
export declare function getPreviousBusinessDay(date: Date | string): Date | null;
/**
 * Check for common US holidays (basic implementation)
 */
export declare function isUSHoliday(date: Date | string): boolean;
/**
 * Format duration in human readable format
 */
export declare function formatDuration(minutes: number): string;
/**
 * Create time slots for scheduling
 */
export declare function generateTimeSlots(startTime: string, endTime: string, intervalMinutes?: number): string[];
/**
 * Check if time is within business hours
 */
export declare function isWithinBusinessHours(time: Date | string, businessHours?: {
    start: string;
    end: string;
}): boolean;
//# sourceMappingURL=index.d.ts.map