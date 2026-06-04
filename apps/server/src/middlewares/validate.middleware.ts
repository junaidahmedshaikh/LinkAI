import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { sendError } from "../utils/apiResponse.util";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        ...req.body,
        ...req.params,
        ...req.query,
      });
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const field = err.path.join(".") || "body";
          if (!errors[field]) errors[field] = [];
          errors[field].push(err.message);
        });
        sendError(res, "Validation failed", 422, errors);
        return;
      }
      next(error);
    }
  };
}
