import Papa from "papaparse";
import { Prisma } from "../generated/prisma/client.js";
import prisma from "../config/db.js";
import type { CreateBatchInput } from "../validators/batch.validator.js";
import {
  candidateRowSchema,
  type CandidateRowInput,
} from "../validators/batch.validator.js";


interface CsvValidationError {
  row: number;
  field: string;
  message: string;
}

export class BatchUploadError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: {
      totalRows?: number;
      validRows?: number;
      invalidRows?: number;
      errors?: CsvValidationError[];
    }
  ) {
    super(message);
    this.name = "BatchUploadError";
  }
}   











interface CreateBatchParams {
  input: CreateBatchInput;
  trainingCentreId: string;
  createdById: string;
}

export const createBatch = async ({
  input,
  trainingCentreId,
  createdById,
}: CreateBatchParams) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const batch = await tx.batch.create({
        data: {
          batchCode: input.batchCode,
          name: input.name,
          trainingCentreId,
          createdById,
          status: "DRAFT",
        },
        select: {
          id: true,
          batchCode: true,
          name: true,
          status: true,
          currentSubmissionVersion: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          batchId: batch.id,
          actorId: createdById,
          action: "BATCH_CREATED",
          entityType: "BATCH",
          entityId: batch.id,
          metadata: {
            batchCode: batch.batchCode,
            name: batch.name,
          },
        },
      });

      return batch;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("BATCH_ALREADY_EXISTS");
    }

    throw error;
  }
};


interface UploadCandidatesParams {
  batchId: string;
  trainingCentreId: string;
  uploadedById: string;
  fileBuffer: Buffer;
}
export const uploadCandidates = async ({
  batchId,
  trainingCentreId,
  uploadedById,
  fileBuffer,
}: UploadCandidatesParams) => {
  // 1. Parse CSV content
  const csvContent = fileBuffer.toString("utf-8");

  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  // 2. Check CSV parsing errors
  if (parsed.errors.length > 0) {
    throw new BatchUploadError(
      "CSV parsing failed",
      400,
      {
        errors: parsed.errors.map((error) => ({
          row: (error.row ?? 0) + 2,
          field: error.code,
          message: error.message,
        })),
      }
    );
  }

  // 3. Validate required CSV headers
  const headers = parsed.meta.fields ?? [];

  const requiredHeaders = [
    "registrationNumber",
    "fullName",
    "phone",
  ];

  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.includes(header)
  );

  if (missingHeaders.length > 0) {
    throw new BatchUploadError(
      "CSV is missing required columns",
      400,
      {
        errors: missingHeaders.map((header) => ({
          row: 1,
          field: header,
          message: `Missing required column: ${header}`,
        })),
      }
    );
  }

  // 4. Remove completely empty rows
  const rows = parsed.data.filter((row) =>
    Object.values(row).some(
      (value) => String(value ?? "").trim() !== ""
    )
  );

  if (rows.length === 0) {
    throw new BatchUploadError("CSV contains no candidate records", 400);
  }

  const validationErrors: CsvValidationError[] = [];
  const validCandidates: CandidateRowInput[] = [];

  // Track registration numbers within this CSV
  const registrationNumbers = new Map<string, number>();

  // 5. Validate every candidate row
  rows.forEach((row, index) => {
    const rowNumber = index + 2;

    const result = candidateRowSchema.safeParse(row);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        validationErrors.push({
          row: rowNumber,
          field: issue.path.join("."),
          message: issue.message,
        });
      });

      return;
    }

    const candidate = result.data;

    // Normalize registration number for duplicate detection
    const normalizedRegistrationNumber =
      candidate.registrationNumber.toUpperCase();

    // Check duplicate registration number within CSV
    const previousRow = registrationNumbers.get(
      normalizedRegistrationNumber
    );

    if (previousRow !== undefined) {
      validationErrors.push({
        row: rowNumber,
        field: "registrationNumber",
        message: `Duplicate registration number. First used in row ${previousRow}`,
      });

      return;
    }

    registrationNumbers.set(
      normalizedRegistrationNumber,
      rowNumber
    );

    validCandidates.push({
      ...candidate,
      registrationNumber: normalizedRegistrationNumber,
    });
  });

  // 6. Reject entire CSV if any row is invalid
  if (validationErrors.length > 0) {
    throw new BatchUploadError(
      "CSV validation failed",
      400,
      {
        totalRows: rows.length,
        validRows: validCandidates.length,
        invalidRows: rows.length - validCandidates.length,
        errors: validationErrors,
      }
    );
  }

  // 7. Save all candidates in one database transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Verify batch ownership and status
      const batch = await tx.batch.findFirst({
        where: {
          id: batchId,
          trainingCentreId,
        },
      });

      if (!batch) {
        throw new BatchUploadError(
          "Batch not found",
          404
        );
      }

      if (batch.status !== "DRAFT") {
        throw new BatchUploadError(
          "Candidates can only be uploaded to draft batches",
          409
        );
      }

      // Check duplicates against existing database records
      const existingCandidates = await tx.candidate.findMany({
        where: {
          batchId,
          registrationNumber: {
            in: validCandidates.map(
              (candidate) => candidate.registrationNumber
            ),
          },
        },
        select: {
          registrationNumber: true,
        },
      });

      if (existingCandidates.length > 0) {
        const existingNumbers = new Set(
          existingCandidates.map(
            (candidate) => candidate.registrationNumber
          )
        );

        const duplicateErrors = validCandidates
          .map((candidate, index) => ({
            candidate,
            row: index + 2,
          }))
          .filter(({ candidate }) =>
            existingNumbers.has(candidate.registrationNumber)
          )
          .map(({ candidate, row }) => ({
            row,
            field: "registrationNumber",
            message: `Registration number ${candidate.registrationNumber} already exists in this batch`,
          }));

        throw new BatchUploadError(
          "Some candidates already exist in this batch",
          409,
          {
            totalRows: rows.length,
            validRows: rows.length - duplicateErrors.length,
            invalidRows: duplicateErrors.length,
            errors: duplicateErrors,
          }
        );
      }

      // Insert all candidates together
      const created = await tx.candidate.createMany({
        data: validCandidates.map((candidate) => ({
          registrationNumber: candidate.registrationNumber,
          fullName: candidate.fullName,
          email: candidate.email || null,
          phone: candidate.phone,
          batchId,
        })),
      });

      await tx.auditLog.create({
        data: {
          batchId,
          actorId: uploadedById,
          action: "CANDIDATES_UPLOADED",
          entityType: "BATCH",
          entityId: batchId,
          metadata: {
            totalCandidates: created.count,
          },
        },
      });

      return created;
    });

    return {
      totalRows: rows.length,
      insertedCount: result.count,
    };
  } catch (error) {
    if (
      error instanceof BatchUploadError
    ) {
      throw error;
    }

    // Handles a concurrent upload that inserts a duplicate
    // after our duplicate check.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new BatchUploadError(
        "One or more registration numbers already exist in this batch",
        409
      );
    }

    throw error;
  }
};



interface GetCandidatesParams {
  batchId: string;
  trainingCentreId: string;
}

export const getCandidatesByBatch = async ({
  batchId,
  trainingCentreId,
}: GetCandidatesParams) => {
  // Step 1: Verify that the batch belongs to this Training Centre
  const batch = await prisma.batch.findFirst({
    where: {
      id: batchId,
      trainingCentreId,
    },
  });

  if (!batch) {
    throw new BatchUploadError(
      "Batch not found",
      404
    );
  }

  // Step 2: Retrieve candidates belonging to this batch
  const candidates = await prisma.candidate.findMany({
    where: {
      batchId,
    },
    select: {
      id: true,
      registrationNumber: true,
      fullName: true,
      email: true,
      phone: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Step 3: Return the result
  return {
    batchId: batch.id,
    batchCode: batch.batchCode,
    batchName: batch.name,
    totalCandidates: candidates.length,
    candidates,
  };
};


interface SubmitBatchParams {
  batchId: string;
  trainingCentreId: string;
  submittedById: string;
}

export const submitBatch = async ({
  batchId,
  trainingCentreId,
  submittedById,
}: SubmitBatchParams) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify batch ownership
    const batch = await tx.batch.findFirst({
      where: {
        id: batchId,
        trainingCentreId,
      },
    });

    if (!batch) {
      throw new BatchUploadError("Batch not found", 404);
    }

    // 2. Only DRAFT batches can be submitted
    if (batch.status !== "DRAFT") {
      throw new BatchUploadError(
        "Only draft batches can be submitted",
        400
      );
    }

    // 3. Check whether the batch has candidates
    const candidateCount = await tx.candidate.count({
      where: {
        batchId,
      },
    });

    if (candidateCount === 0) {
      throw new BatchUploadError(
        "Cannot submit a batch without candidates",
        400
      );
    }

    // 4. Update batch status
    const updatedBatch = await tx.batch.update({
      where: {
        id: batchId,
      },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    // 5. Record audit log
    await tx.auditLog.create({
      data: {
        actorId: submittedById,
        action: "BATCH_SUBMITTED",
        entityType: "BATCH",
        entityId: batchId,
        batchId,
        metadata: {
          totalCandidates: candidateCount,
          submissionVersion: batch.currentSubmissionVersion,
        },
      },
    });

    return {
      batchId: updatedBatch.id,
      batchCode: updatedBatch.batchCode,
      status: updatedBatch.status,
      submittedAt: updatedBatch.submittedAt,
      totalCandidates: candidateCount,
    };
  });
};
