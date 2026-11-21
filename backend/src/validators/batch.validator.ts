
import { z } from "zod";

export const createBatchSchema = z.object({
  batchCode: z
    .string()
    .trim()
    .min(3, "Batch code must contain at least 3 characters")
    .max(30, "Batch code cannot exceed 30 characters")
    .regex(
      /^[A-Za-z0-9-]+$/,
      "Batch code can contain only letters, numbers and hyphens"
    ),

  name: z
    .string()
    .trim()
    .min(3, "Batch name must contain at least 3 characters")
    .max(100, "Batch name cannot exceed 100 characters"),
});

export const candidateRowSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(1, "Registration number is required")
    .max(50, "Registration number cannot exceed 50 characters"),

  fullName: z
    .string()
    .trim()
    .min(2, "Full name must contain at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),

  email: z
    .union([
      z.string().trim().email("Invalid email address"),
      z.literal(""),
    ])
    .optional(),

  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Phone number must be a valid 10-digit Indian mobile number"),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type CandidateRowInput = z.infer<typeof candidateRowSchema>;
