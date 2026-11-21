import type { Request, Response, NextFunction } from "express";
import { createBatchSchema } from "../validators/batch.validator.js";
import { createBatch } from "../services/batch.service.js";
import {
  uploadCandidates,
  BatchUploadError,
  getCandidatesByBatch,
  submitBatch
} from "../services/batch.service.js";


export const createBatchController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validation = createBatchSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== "TRAINING_CENTRE" || !req.user.trainingCentreId) {
      return res.status(403).json({
        success: false,
        message: "Only training centre users can create batches",
      });
    }

    const batch = await createBatch({
      input: validation.data,
      trainingCentreId: req.user.trainingCentreId,
      createdById: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Batch created successfully",
      data: batch,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BATCH_ALREADY_EXISTS") {
      return res.status(409).json({
        success: false,
        message: "A batch with this code already exists",
      });
    }

    next(error);
  }
};

export const uploadCandidatesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.trainingCentreId) {
      return res.status(403).json({
        success: false,
        message: "Training centre access required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a CSV file",
      });
    }

    // const { batchId } = req.params;
    const batchId = req.params.batchId;

    if (typeof batchId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
    }

    const result = await uploadCandidates({
      batchId,
      trainingCentreId: req.user.trainingCentreId,
      uploadedById: req.user.id,
      fileBuffer: req.file.buffer,
    });

    return res.status(201).json({
      success: true,
      message: "Candidates uploaded successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof BatchUploadError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        data: error.details,
      });
    }

    next(error);
  }
};



export const getCandidatesByBatchController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Step 1: Check authenticated Training Centre
    const trainingCentreId = req.user?.trainingCentreId;

    if (!trainingCentreId) {
      return res.status(403).json({
        success: false,
        message: "Training Centre access required",
      });
    }

    // Step 2: Validate batch ID
    const batchId = req.params.batchId;

    if (typeof batchId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
    }

    // Step 3: Call service
    const result = await getCandidatesByBatch({
      batchId,
      trainingCentreId,
    });

    // Step 4: Send response
    return res.status(200).json({
      success: true,
      message: "Candidates retrieved successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof BatchUploadError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};


export const submitBatchController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Verify authenticated Training Centre
    const trainingCentreId = req.user?.trainingCentreId;

    if (!trainingCentreId) {
      return res.status(403).json({
        success: false,
        message: "Training Centre access required",
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

    // 3. Call service
    const result = await submitBatch({
      batchId,
      trainingCentreId,
      submittedById: req.user!.id,
    });

    // 4. Return success response
    return res.status(200).json({
      success: true,
      message: "Batch submitted successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof BatchUploadError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};
