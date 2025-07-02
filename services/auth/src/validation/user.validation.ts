import Joi from 'joi';
import { PayType, PayFrequency } from '../models/user.model';

export const paramValidation = {
  userId: Joi.object({
    userId: Joi.string().uuid().required(),
  }),
};

export const userValidation = {
  createUser: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string()
      .min(3)
      .max(50)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Username can only contain letters, numbers, underscore and dash',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot be longer than 50 characters'
      }),
    password: Joi.string().min(8).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .message('Password must contain uppercase, lowercase, number and special character'),
    firstName: Joi.string().max(100).optional(),
    lastName: Joi.string().max(100).optional(),
    phone: Joi.string()
      .max(20)
      .pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .required()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    roles: Joi.array().items(Joi.string()).optional(),
    rolePreset: Joi.string().optional(),
    department: Joi.string().max(100).optional(),
    position: Joi.string().max(100).optional(),
    hireDate: Joi.date().iso().optional(),
    payType: Joi.string().valid(...Object.values(PayType)).optional(),
    salaryAmount: Joi.number().min(0).max(1000000).optional(),
    hourlyRate: Joi.number().min(0).max(1000).optional(),
    commissionRate: Joi.number().min(0).max(100).optional(),
    baseSalary: Joi.number().min(0).max(1000000).optional(),
    payFrequency: Joi.string().valid(...Object.values(PayFrequency)).optional(),
    defaultHoursPerWeek: Joi.number().min(0).max(168).optional(),
    sendWelcomeEmail: Joi.boolean().optional(),
  }),

  updateUser: Joi.object({
    firstName: Joi.string().max(100).optional(),
    lastName: Joi.string().max(100).optional(),
    phone: Joi.string().max(20).optional(),
    avatarUrl: Joi.string().uri().optional(),
    isActive: Joi.boolean().optional(),
    department: Joi.string().max(100).optional(),
    position: Joi.string().max(100).optional(),
    payType: Joi.string().valid(...Object.values(PayType)).optional(),
    salaryAmount: Joi.number().min(0).max(1000000).optional(),
    hourlyRate: Joi.number().min(0).max(1000).optional(),
    overtimeRate: Joi.number().min(0).max(1000).optional(),
    commissionRate: Joi.number().min(0).max(100).optional(),
    baseSalary: Joi.number().min(0).max(1000000).optional(),
    payFrequency: Joi.string().valid(...Object.values(PayFrequency)).optional(),
    defaultHoursPerWeek: Joi.number().min(0).max(168).optional(),
    bankAccountNumber: Joi.string().max(50).optional(),
    routingNumber: Joi.string().max(20).optional(),
  }),

  listUsers: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).optional(),
    roles: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ).optional(),
    isActive: Joi.boolean().optional(),
    isVerified: Joi.boolean().optional(),
    department: Joi.string().optional(),
    hasSchedule: Joi.boolean().optional(),
  }),

  assignRoles: Joi.object({
    roles: Joi.array().items(Joi.string()).min(1).required(),
  }),

  resetPassword: Joi.object({
    newPassword: Joi.string().min(8).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .message('Password must contain uppercase, lowercase, number and special character'),
  }),
};

// Bulk operations validation
export const bulkValidation = {
  bulkDeactivate: Joi.object({
    userIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
    reason: Joi.string().max(500).optional(),
    effectiveDate: Joi.date().iso().optional(),
  }),
};