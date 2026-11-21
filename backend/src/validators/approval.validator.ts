
import { z } from "zod";

export const districtReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "RETURNED"], {
    error: "Invalid review decision",
  }),

  comment: z.string().trim().max(500, "Comment cannot exceed 500 characters").optional(),
}).superRefine((data, ctx) => {
  if (
    (data.decision === "REJECTED" || data.decision === "RETURNED") &&
    !data.comment
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["comment"],
      message: "Comment is required when rejecting or returning a batch",
    });
  }
});

export type DistrictReviewInput = z.infer<typeof districtReviewSchema>;


export const qualityReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "RETURNED"], {
    error: "Invalid review decision",
  }),
  comment: z
    .string()
    .trim()
    .max(500, "Comment cannot exceed 500 characters")
    .optional(),
}).superRefine((data, ctx) => {
  if (
    (data.decision === "REJECTED" || data.decision === "RETURNED") &&
    !data.comment
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["comment"],
      message: "Comment is required when rejecting or returning a batch",
    });
  }
});

export type QualityReviewInput = z.infer<typeof qualityReviewSchema>;



export const stateReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "RETURNED"], {
    error: "Invalid review decision",
  }),
  comment: z
    .string()
    .trim()
    .max(500, "Comment cannot exceed 500 characters")
    .optional(),
}).superRefine((data, ctx) => {
  if (
    (data.decision === "REJECTED" || data.decision === "RETURNED") &&
    !data.comment
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["comment"],
      message: "Comment is required when rejecting or returning a batch",
    });
  }
});

export type StateReviewInput = z.infer<typeof stateReviewSchema>;
