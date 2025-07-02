"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
/**
 * Validation middleware for request body
 */
function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    details: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                },
                correlationId: req.correlationId,
                timestamp: new Date().toISOString()
            });
        }
        req.body = value;
        next();
    };
}
/**
 * Validation middleware for query parameters
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Query parameter validation failed',
                    details: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                },
                correlationId: req.correlationId,
                timestamp: new Date().toISOString()
            });
        }
        req.query = value;
        next();
    };
}
/**
 * Validation middleware for URL parameters
 */
function validateParams(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params);
        if (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'URL parameter validation failed',
                    details: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                },
                correlationId: req.correlationId,
                timestamp: new Date().toISOString()
            });
        }
        req.params = value;
        next();
    };
}
