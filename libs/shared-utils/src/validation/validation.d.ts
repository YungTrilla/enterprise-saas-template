import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
/**
 * Validation middleware for request body
 */
export declare function validate(schema: Joi.Schema): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Validation middleware for query parameters
 */
export declare function validateQuery(schema: Joi.Schema): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Validation middleware for URL parameters
 */
export declare function validateParams(schema: Joi.Schema): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=validation.d.ts.map