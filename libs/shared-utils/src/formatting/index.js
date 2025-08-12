'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.formatCurrency = formatCurrency;
exports.formatPercentage = formatPercentage;
exports.formatLargeNumber = formatLargeNumber;
exports.formatFileSize = formatFileSize;
exports.formatDecimal = formatDecimal;
exports.toTitleCase = toTitleCase;
exports.toKebabCase = toKebabCase;
exports.toCamelCase = toCamelCase;
exports.toSnakeCase = toSnakeCase;
exports.toPascalCase = toPascalCase;
exports.truncateText = truncateText;
exports.truncateAtWord = truncateAtWord;
exports.getInitials = getInitials;
exports.capitalizeWords = capitalizeWords;
exports.normalizeWhitespace = normalizeWhitespace;
exports.formatPhoneNumber = formatPhoneNumber;
exports.formatAddress = formatAddress;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.formatTime = formatTime;
exports.formatRelativeTime = formatRelativeTime;
exports.formatSku = formatSku;
exports.formatOrderNumber = formatOrderNumber;
exports.formatQuantity = formatQuantity;
exports.formatAvailabilityStatus = formatAvailabilityStatus;
exports.formatUtilization = formatUtilization;
exports.formatErrorMessage = formatErrorMessage;
exports.formatValidationErrors = formatValidationErrors;
exports.formatStatusBadge = formatStatusBadge;
const date_fns_1 = require('date-fns');
// ========================================
// Number Formatting
// ========================================
/**
 * Format currency with proper locale and symbol
 */
function formatCurrency(amount, currency = 'USD', locale = 'en-US', options) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `$${amount.toFixed(2)}`;
  }
}
/**
 * Format percentage with specified decimal places
 */
function formatPercentage(value, decimalPlaces = 1, locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(value / 100);
  } catch (error) {
    return `${value.toFixed(decimalPlaces)}%`;
  }
}
/**
 * Format large numbers with abbreviations (K, M, B)
 */
function formatLargeNumber(num, precision = 1, locale = 'en-US') {
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1e9) {
    return `${sign}${(abs / 1e9).toFixed(precision)}B`;
  } else if (abs >= 1e6) {
    return `${sign}${(abs / 1e6).toFixed(precision)}M`;
  } else if (abs >= 1e3) {
    return `${sign}${(abs / 1e3).toFixed(precision)}K`;
  }
  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch (error) {
    return num.toString();
  }
}
/**
 * Format file size in human readable format
 */
function formatFileSize(bytes, precision = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(precision))} ${sizes[i]}`;
}
/**
 * Format decimal numbers with specified precision
 */
function formatDecimal(num, precision = 2, locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(num);
  } catch (error) {
    return num.toFixed(precision);
  }
}
// ========================================
// Text Formatting
// ========================================
/**
 * Convert string to title case
 */
function toTitleCase(str) {
  if (typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
/**
 * Convert string to kebab-case
 */
function toKebabCase(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}
/**
 * Convert string to camelCase
 */
function toCamelCase(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}
/**
 * Convert string to snake_case
 */
function toSnakeCase(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}
/**
 * Convert string to PascalCase
 */
function toPascalCase(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase()).replace(/\s+/g, '');
}
/**
 * Truncate text with ellipsis
 */
function truncateText(text, maxLength, ellipsis = '...') {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - ellipsis.length).trim() + ellipsis;
}
/**
 * Truncate text at word boundary
 */
function truncateAtWord(text, maxLength, ellipsis = '...') {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength - ellipsis.length);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace).trim() + ellipsis;
  }
  return truncated.trim() + ellipsis;
}
/**
 * Extract initials from full name
 */
function getInitials(name, maxInitials = 2) {
  if (typeof name !== 'string') return '';
  const words = name.trim().split(/\s+/);
  const initials = words
    .slice(0, maxInitials)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  return initials;
}
/**
 * Capitalize first letter of each word
 */
function capitalizeWords(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\b\w/g, char => char.toUpperCase());
}
/**
 * Remove extra whitespace and normalize
 */
function normalizeWhitespace(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\s+/g, ' ').trim();
}
// ========================================
// Address and Contact Formatting
// ========================================
/**
 * Format phone number with standard formatting
 */
function formatPhoneNumber(phone, format = 'US') {
  if (typeof phone !== 'string') return '';
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  if (format === 'US' && digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (format === 'US' && digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else if (format === 'INTERNATIONAL') {
    return `+${digits}`;
  }
  return phone; // Return original if no formatting rules match
}
/**
 * Format address for display
 */
function formatAddress(address) {
  const parts = [];
  if (address.street) parts.push(address.street);
  const cityStateZip = [address.city, address.state, address.postalCode].filter(Boolean).join(' ');
  if (cityStateZip) parts.push(cityStateZip);
  if (address.country && address.country !== 'US') parts.push(address.country);
  return parts.join(', ');
}
// ========================================
// Date and Time Formatting
// ========================================
/**
 * Format date in user-friendly format
 */
function formatDate(date, formatString = 'MMM dd, yyyy') {
  try {
    const dateObj = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
    if (!(0, date_fns_1.isValid)(dateObj)) return 'Invalid Date';
    return (0, date_fns_1.format)(dateObj, formatString);
  } catch (error) {
    return 'Invalid Date';
  }
}
/**
 * Format date and time
 */
function formatDateTime(date, formatString = 'MMM dd, yyyy hh:mm a') {
  return formatDate(date, formatString);
}
/**
 * Format time only
 */
function formatTime(date, formatString = 'hh:mm a') {
  return formatDate(date, formatString);
}
/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date) {
  try {
    const dateObj = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
    if (!(0, date_fns_1.isValid)(dateObj)) return 'Invalid Date';
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    if (diffInDays < 30) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
  } catch (error) {
    return 'Invalid Date';
  }
}
// ========================================
// Business-Specific Formatting
// ========================================
/**
 * Format SKU with proper formatting
 */
function formatSku(sku) {
  if (typeof sku !== 'string') return '';
  return sku.toUpperCase().replace(/[^A-Z0-9-]/g, '');
}
/**
 * Format order number with prefix
 */
function formatOrderNumber(orderNumber, prefix = 'ORD') {
  const num = typeof orderNumber === 'string' ? orderNumber : orderNumber.toString();
  return `${prefix}-${num.padStart(6, '0')}`;
}
/**
 * Format inventory quantity with units
 */
function formatQuantity(quantity, unit = 'units') {
  const formattedNum = formatDecimal(quantity, 0);
  return `${formattedNum} ${quantity === 1 ? unit.replace(/s$/, '') : unit}`;
}
/**
 * Format availability status
 */
function formatAvailabilityStatus(available, total, reserved = 0) {
  const inUse = total - available;
  if (available === 0) return 'Out of Stock';
  if (available === total) return 'Fully Available';
  if (reserved > 0) return `${available} Available (${reserved} Reserved)`;
  return `${available} of ${total} Available`;
}
/**
 * Format utilization percentage
 */
function formatUtilization(used, total) {
  if (total === 0) return '0%';
  const percentage = (used / total) * 100;
  return formatPercentage(percentage, 1);
}
// ========================================
// Error and Status Formatting
// ========================================
/**
 * Format API error message for display
 */
function formatErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  return 'An unexpected error occurred';
}
/**
 * Format validation errors for display
 */
function formatValidationErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) return '';
  return errors
    .map(error => `${toTitleCase(error.field.replace(/[._]/g, ' '))}: ${error.message}`)
    .join('; ');
}
/**
 * Format status badge text
 */
function formatStatusBadge(status) {
  return status
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
