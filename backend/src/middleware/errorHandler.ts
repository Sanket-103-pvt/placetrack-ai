import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";

export function errorHandler(error: any, request: Request, response: Response, next: NextFunction) {
  // 1. ZodError validation
  if (error instanceof ZodError) {
    const fieldErrors = error.errors.map(err => `${err.path.join(".")}: ${err.message}`).join(", ");
    return response.status(400).json({
      error: `Validation failed: ${fieldErrors}`,
      code: "VALIDATION_ERROR"
    });
  }

  // 2. Prisma P2002 Unique Constraint
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return response.status(409).json({
        error: "This record already exists",
        code: "UNIQUE_CONSTRAINT_VIOLATION"
      });
    }
    // 3. Prisma P2025 Not Found
    if (error.code === "P2025") {
      return response.status(404).json({
        error: "Record not found",
        code: "NOT_FOUND"
      });
    }
  }

  // 4. Multer upload errors
  if (error instanceof MulterError || (error instanceof Error && error.message.includes("allowed"))) {
    return response.status(400).json({
      error: error.message,
      code: "UPLOAD_ERROR"
    });
  }

  // Log unexpected errors
  console.error(error);

  // 5. General fallback
  const isProduction = process.env.NODE_ENV === "production";
  return response.status(500).json({
    error: isProduction ? "Something went wrong" : error.message || "Something went wrong",
    code: "INTERNAL_SERVER_ERROR"
  });
}
