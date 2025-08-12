import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Define a type for the Express middleware function
type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;

export function validate(schema: ZodSchema<any>): ExpressMiddleware {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Error de validación.',
          errors: error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return; // Stop execution after sending response
      }
      // Forward other errors to the global error handler
      next(error);
    }
  };
}