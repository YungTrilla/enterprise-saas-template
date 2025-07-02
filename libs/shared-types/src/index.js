"use strict";
/**
 * Abyss Central - Shared Types Library
 *
 * This library contains all shared TypeScript type definitions used across
 * the Abyss Suite services and applications.
 *
 * Following the data exchange standards defined in the roadmap:
 * - JSON format for all data interchange
 * - camelCase field naming convention
 * - UUIDv4 for entity identifiers
 * - ISO 8601 timestamps in UTC
 * - UPPER_SNAKE_CASE for enum values
 * - Structured error responses with correlation IDs
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_VERSION = exports.VERSION = exports.TimeEntryStatus = exports.FuelType = exports.LicenseType = exports.ProficiencyLevel = exports.AccessLevel = exports.PayFrequency = exports.EmployeeType = exports.EmploymentStatus = void 0;
// Export all common types
__exportStar(require("./common"), exports);
// Export domain-specific types
__exportStar(require("./inventory"), exports);
__exportStar(require("./orders"), exports);
var employees_1 = require("./employees");
Object.defineProperty(exports, "EmploymentStatus", { enumerable: true, get: function () { return employees_1.EmploymentStatus; } });
Object.defineProperty(exports, "EmployeeType", { enumerable: true, get: function () { return employees_1.EmployeeType; } });
Object.defineProperty(exports, "PayFrequency", { enumerable: true, get: function () { return employees_1.PayFrequency; } });
Object.defineProperty(exports, "AccessLevel", { enumerable: true, get: function () { return employees_1.AccessLevel; } });
Object.defineProperty(exports, "ProficiencyLevel", { enumerable: true, get: function () { return employees_1.ProficiencyLevel; } });
Object.defineProperty(exports, "LicenseType", { enumerable: true, get: function () { return employees_1.LicenseType; } });
Object.defineProperty(exports, "FuelType", { enumerable: true, get: function () { return employees_1.FuelType; } });
Object.defineProperty(exports, "TimeEntryStatus", { enumerable: true, get: function () { return employees_1.TimeEntryStatus; } });
// Version info
exports.VERSION = '0.1.0';
exports.API_VERSION = 'v1';
