
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { districtReviewSchema,qualityReviewSchema,stateReviewSchema } from "../validators/approval.validator.js";
import {
    submitQualityReview,
  submitDistrictReview,
  ApprovalError,
  submitStateReview
} from "../services/approval.service.js";

export const districtReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Verify authenticated District Officer
    const officer = req.user;

    if (!officer || officer.role !== "DISTRICT_OFFICER") {
      return res.status(403).json({
        success: false,
        message: "District Officer access required",
      });
    }

    if (!officer.district) {
      return res.status(403).json({
        success: false,
        message: "District is not assigned to this officer",
      });
    }

    // 2. Validate batch ID
    const batchId = req.params.batchId;

    if (typeof batchId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
    }

    // 3. Validate request body
    const validation = districtReviewSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: z.treeifyError(validation.error),
      });
    }

    // 4. Call service
    const result = await submitDistrictReview({
      batchId,
      officerId: officer.id,
      officerDistrict: officer.district,
      input: validation.data,
    });

    // 5. Return response
    return res.status(200).json({
      success: true,
      message: "District review completed successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof ApprovalError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};



export const qualityReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const officer = req.user;

    if (!officer || officer.role !== "QUALITY_OFFICER") {
      return res.status(403).json({
        success: false,
        message: "Quality Officer access required",
      });
    }

    if (!officer.district) {
      return res.status(403).json({
        success: false,
        message: "District is not assigned to this officer",
      });
    }

    const batchId = req.params.batchId;

    if (typeof batchId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
    }

    const validation = qualityReviewSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: z.treeifyError(validation.error),
      });
    }

    const result = await submitQualityReview({
      batchId,
      officerId: officer.id,
      officerDistrict: officer.district,
      input: validation.data,
    });

    return res.status(200).json({
      success: true,
      message: "Quality review completed successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof ApprovalError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};



export const stateReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const officer = req.user;

    if (!officer || officer.role !== "STATE_OFFICER") {
      return res.status(403).json({
        success: false,
        message: "State Officer access required",
      });
    }

    const batchId = req.params.batchId;

    if (typeof batchId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
    }

    const validation = stateReviewSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: z.treeifyError(validation.error),
      });
    }

    const result = await submitStateReview({
      batchId,
      officerId: officer.id,
      input: validation.data,
    });

    return res.status(200).json({
      success: true,
      message: "State review completed successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof ApprovalError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};
