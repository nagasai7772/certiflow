
import type { Request, Response, NextFunction } from "express";

import {
  issueBatchCertificates,
  CertificateError,
} from "../services/certificate.service.js";

export const issueBatchCertificatesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Verify authenticated State Officer
    const officer = req.user;

    if (!officer || officer.role !== "STATE_OFFICER") {
      return res.status(403).json({
        success: false,
        message: "State Officer access required",
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

    // 3. Call certificate service
    const result = await issueBatchCertificates({
      batchId,
      issuedById: officer.id,
    });

    // 4. Return response
    return res.status(200).json({
      success: true,
      message: "Certificates generated successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof CertificateError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};
