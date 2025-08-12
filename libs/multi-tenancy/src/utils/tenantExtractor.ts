/**
 * Tenant Extraction Utilities
 *
 * Extracts tenant identifiers from various parts of HTTP requests
 */

import { Request } from 'express';
import { TenantResolutionStrategy } from '../types/tenant';

export interface TenantExtractionOptions {
  strategy: TenantResolutionStrategy;
  headerName?: string;
  queryParam?: string;
  pathPattern?: string;
}

/**
 * Extract tenant identifier from request based on strategy
 */
export function extractTenantFromRequest(
  req: Request,
  options: TenantExtractionOptions
): string | null {
  const {
    strategy,
    headerName = 'X-Tenant-ID',
    queryParam = 'tenant',
    pathPattern = '/tenant/:slug',
  } = options;

  switch (strategy) {
    case TenantResolutionStrategy.SUBDOMAIN:
      return extractFromSubdomain(req);

    case TenantResolutionStrategy.DOMAIN:
      return extractFromDomain(req);

    case TenantResolutionStrategy.HEADER:
      return extractFromHeader(req, headerName);

    case TenantResolutionStrategy.PATH:
      return extractFromPath(req, pathPattern);

    case TenantResolutionStrategy.QUERY_PARAM:
      return extractFromQueryParam(req, queryParam);

    default:
      return null;
  }
}

/**
 * Extract tenant from subdomain (e.g., tenant.example.com -> tenant)
 */
export function extractFromSubdomain(req: Request): string | null {
  const host = req.get('host') || req.hostname;
  if (!host) return null;

  // Remove port if present
  const hostname = host.split(':')[0];
  const parts = hostname.split('.');

  // Need at least 3 parts for subdomain (subdomain.domain.tld)
  if (parts.length < 3) return null;

  const subdomain = parts[0];

  // Filter out common non-tenant subdomains
  const excludedSubdomains = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'cdn'];
  if (excludedSubdomains.includes(subdomain.toLowerCase())) {
    return null;
  }

  return subdomain;
}

/**
 * Extract tenant from custom domain (e.g., customer.com -> customer.com)
 */
export function extractFromDomain(req: Request): string | null {
  const host = req.get('host') || req.hostname;
  if (!host) return null;

  // Remove port if present
  const hostname = host.split(':')[0];

  // Skip if it's a subdomain of the main platform
  const platformDomains = process.env.PLATFORM_DOMAINS?.split(',') || ['localhost', 'example.com'];

  for (const platformDomain of platformDomains) {
    if (hostname.endsWith(platformDomain)) {
      return null;
    }
  }

  return hostname;
}

/**
 * Extract tenant from HTTP header
 */
export function extractFromHeader(req: Request, headerName: string): string | null {
  const value = req.get(headerName);
  return value && value.trim() ? value.trim() : null;
}

/**
 * Extract tenant from URL path pattern
 */
export function extractFromPath(req: Request, pathPattern: string): string | null {
  const path = req.path;

  // Convert path pattern to regex
  // e.g., "/tenant/:slug" becomes /^\/tenant\/([^\/]+)/
  const pattern = pathPattern.replace(/:\w+/g, '([^/]+)').replace(/\//g, '\\/');

  const regex = new RegExp(`^${pattern}`);
  const match = path.match(regex);

  return match && match[1] ? match[1] : null;
}

/**
 * Extract tenant from query parameter
 */
export function extractFromQueryParam(req: Request, paramName: string): string | null {
  const value = req.query[paramName];

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return null;
}

/**
 * Validate tenant identifier format
 */
export function validateTenantIdentifier(identifier: string): boolean {
  // Tenant identifiers should be:
  // - 3-63 characters long
  // - Only alphanumeric characters and hyphens
  // - Start and end with alphanumeric character
  // - Not contain consecutive hyphens
  const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

  if (!pattern.test(identifier)) {
    return false;
  }

  if (identifier.length < 3 || identifier.length > 63) {
    return false;
  }

  if (identifier.includes('--')) {
    return false;
  }

  return true;
}

/**
 * Sanitize tenant identifier
 */
export function sanitizeTenantIdentifier(identifier: string): string {
  return identifier
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 63);
}

/**
 * Check if identifier is a reserved name
 */
export function isReservedTenantIdentifier(identifier: string): boolean {
  const reserved = [
    'www',
    'api',
    'admin',
    'app',
    'mail',
    'ftp',
    'cdn',
    'assets',
    'static',
    'docs',
    'help',
    'support',
    'blog',
    'status',
    'security',
    'legal',
    'privacy',
    'terms',
    'about',
    'contact',
    'pricing',
    'features',
    'dashboard',
    'console',
    'portal',
    'panel',
    'manager',
    'control',
    'system',
    'root',
    'administrator',
    'user',
    'users',
    'account',
    'billing',
    'payment',
    'invoice',
    'subscription',
    'settings',
    'profile',
    'preferences',
    'notifications',
    'alerts',
    'reports',
    'analytics',
    'metrics',
    'logs',
    'audit',
    'security',
    'backup',
    'restore',
    'migrate',
    'import',
    'export',
    'download',
    'upload',
  ];

  return reserved.includes(identifier.toLowerCase());
}

/**
 * Generate suggestions for invalid tenant identifiers
 */
export function suggestTenantIdentifier(desired: string): string[] {
  const base = sanitizeTenantIdentifier(desired);
  const suggestions: string[] = [];

  if (base.length >= 3 && !isReservedTenantIdentifier(base)) {
    suggestions.push(base);
  }

  // Add numeric suffixes
  for (let i = 1; i <= 5; i++) {
    const suggestion = `${base}-${i}`;
    if (suggestion.length <= 63 && !isReservedTenantIdentifier(suggestion)) {
      suggestions.push(suggestion);
    }
  }

  // Add year suffix
  const year = new Date().getFullYear().toString();
  const withYear = `${base}-${year}`;
  if (withYear.length <= 63 && !isReservedTenantIdentifier(withYear)) {
    suggestions.push(withYear);
  }

  return suggestions.slice(0, 5);
}
