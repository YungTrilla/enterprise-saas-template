/**
 * Format currency with proper locale and symbol
 */
export declare function formatCurrency(amount: number, currency?: string, locale?: string, options?: Intl.NumberFormatOptions): string;
/**
 * Format percentage with specified decimal places
 */
export declare function formatPercentage(value: number, decimalPlaces?: number, locale?: string): string;
/**
 * Format large numbers with abbreviations (K, M, B)
 */
export declare function formatLargeNumber(num: number, precision?: number, locale?: string): string;
/**
 * Format file size in human readable format
 */
export declare function formatFileSize(bytes: number, precision?: number): string;
/**
 * Format decimal numbers with specified precision
 */
export declare function formatDecimal(num: number, precision?: number, locale?: string): string;
/**
 * Convert string to title case
 */
export declare function toTitleCase(str: string): string;
/**
 * Convert string to kebab-case
 */
export declare function toKebabCase(str: string): string;
/**
 * Convert string to camelCase
 */
export declare function toCamelCase(str: string): string;
/**
 * Convert string to snake_case
 */
export declare function toSnakeCase(str: string): string;
/**
 * Convert string to PascalCase
 */
export declare function toPascalCase(str: string): string;
/**
 * Truncate text with ellipsis
 */
export declare function truncateText(text: string, maxLength: number, ellipsis?: string): string;
/**
 * Truncate text at word boundary
 */
export declare function truncateAtWord(text: string, maxLength: number, ellipsis?: string): string;
/**
 * Extract initials from full name
 */
export declare function getInitials(name: string, maxInitials?: number): string;
/**
 * Capitalize first letter of each word
 */
export declare function capitalizeWords(str: string): string;
/**
 * Remove extra whitespace and normalize
 */
export declare function normalizeWhitespace(str: string): string;
/**
 * Format phone number with standard formatting
 */
export declare function formatPhoneNumber(phone: string, format?: 'US' | 'INTERNATIONAL'): string;
/**
 * Format address for display
 */
export declare function formatAddress(address: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}): string;
/**
 * Format date in user-friendly format
 */
export declare function formatDate(date: string | Date, formatString?: string): string;
/**
 * Format date and time
 */
export declare function formatDateTime(date: string | Date, formatString?: string): string;
/**
 * Format time only
 */
export declare function formatTime(date: string | Date, formatString?: string): string;
/**
 * Format relative time (e.g., "2 hours ago")
 */
export declare function formatRelativeTime(date: string | Date): string;
/**
 * Format SKU with proper formatting
 */
export declare function formatSku(sku: string): string;
/**
 * Format order number with prefix
 */
export declare function formatOrderNumber(orderNumber: string | number, prefix?: string): string;
/**
 * Format inventory quantity with units
 */
export declare function formatQuantity(quantity: number, unit?: string): string;
/**
 * Format availability status
 */
export declare function formatAvailabilityStatus(available: number, total: number, reserved?: number): string;
/**
 * Format utilization percentage
 */
export declare function formatUtilization(used: number, total: number): string;
/**
 * Format API error message for display
 */
export declare function formatErrorMessage(error: any): string;
/**
 * Format validation errors for display
 */
export declare function formatValidationErrors(errors: Array<{
    field: string;
    message: string;
}>): string;
/**
 * Format status badge text
 */
export declare function formatStatusBadge(status: string): string;
//# sourceMappingURL=index.d.ts.map