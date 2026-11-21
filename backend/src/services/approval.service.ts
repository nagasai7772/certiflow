
import prisma from "../config/db.js";
import type { DistrictReviewInput,QualityReviewInput,StateReviewInput } from "../validators/approval.validator.js";

interface DistrictReviewParams {
  batchId: string;
  officerId: string;
  officerDistrict: string;
  input: DistrictReviewInput;
}

export class ApprovalError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ApprovalError";
  }
}

export const submitDistrictReview = async ({
  batchId,
  officerId,
  officerDistrict,
  input,
}: DistrictReviewParams) => {
  return await prisma.$transaction(async (tx) => {

    // 1. Find the batch
    const batch = await tx.batch.findUnique({
      where: {
        id: batchId,
      },
      select: {
        id: true,
        batchCode: true,
        status: true,
        currentSubmissionVersion: true,
        trainingCentre: {
          select: {
            district: true,
          },
        },
      },
    });

    if (!batch) {
      throw new ApprovalError("Batch not found", 404);
    }

    // 2. Verify district ownership
    if (batch.trainingCentre.district !== officerDistrict) {
      throw new ApprovalError(
        "You are not authorized to review this batch",
        403
      );
    }

    // 3. Verify batch status
    if (batch.status !== "SUBMITTED") {
      throw new ApprovalError(
        "Only submitted batches can undergo district review",
        400
      );
    }

    // 4. Determine the next batch status
    const nextStatus = {
      APPROVED: "QUALITY_REVIEW",
      REJECTED: "REJECTED",
      RETURNED: "RETURNED",
    } as const;

    const updatedStatus = nextStatus[input.decision];

    // 5. Atomically update the batch status
    const updateResult = await tx.batch.updateMany({
      where: {
        id: batchId,
        status: "SUBMITTED",
      },
      data: {
        status: updatedStatus,
        ...(input.decision === "RETURNED"
          ? { returnReason: input.comment }
          : {}),
      },
    });

    // Prevent concurrent officers from reviewing the same submission
    if (updateResult.count !== 1) {
      throw new ApprovalError(
        "This batch has already been reviewed",
        409
      );
    }

    // 6. Create approval history
    const approval = await tx.approval.create({
      data: {
        batchId,
        officerId,
        stage: "DISTRICT",
        decision: input.decision,
        submissionVersion: batch.currentSubmissionVersion,
        comment: input.comment ?? null,
      },
    });

    // 7. Create audit log
    await tx.auditLog.create({
      data: {
        batchId,
        actorId: officerId,
        action: `DISTRICT_${input.decision}`,
        entityType: "BATCH",
        entityId: batchId,
        metadata: {
          batchCode: batch.batchCode,
          decision: input.decision,
          previousStatus: batch.status,
          newStatus: updatedStatus,
          submissionVersion: batch.currentSubmissionVersion,
          comment: input.comment ?? null,
        },
      },
    });

    // 8. Return result
    return {
      batchId,
      batchCode: batch.batchCode,
      decision: approval.decision,
      stage: approval.stage,
      status: updatedStatus,
      comment: approval.comment,
      submissionVersion: approval.submissionVersion,
      reviewedAt: approval.decidedAt,
    };
  });
};



interface QualityReviewParams {
  batchId: string;
  officerId: string;
  officerDistrict: string;
  input: QualityReviewInput;
}

export const submitQualityReview = async ({
  batchId,
  officerId,
  officerDistrict,
  input,
}: QualityReviewParams) => {
  return await prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        batchCode: true,
        status: true,
        currentSubmissionVersion: true,
        trainingCentre: {
          select: { district: true },
        },
      },
    });

    if (!batch) {
      throw new ApprovalError("Batch not found", 404);
    }

    if (batch.trainingCentre.district !== officerDistrict) {
      throw new ApprovalError(
        "You are not authorized to review this batch",
        403
      );
    }

    if (batch.status !== "QUALITY_REVIEW") {
      throw new ApprovalError(
        "Only batches in quality review can be reviewed",
        400
      );
    }

    const nextStatus = {
      APPROVED: "STATE_REVIEW",
      REJECTED: "REJECTED",
      RETURNED: "RETURNED",
    } as const;

    const updatedStatus = nextStatus[input.decision];

    const updateResult = await tx.batch.updateMany({
      where: {
        id: batchId,
        status: "QUALITY_REVIEW",
      },
      data: {
        status: updatedStatus,
        ...(input.decision === "RETURNED"
          ? { returnReason: input.comment }
          : {}),
      },
    });

    if (updateResult.count !== 1) {
      throw new ApprovalError(
        "This batch has already been reviewed",
        409
      );
    }

    const approval = await tx.approval.create({
      data: {
        batchId,
        officerId,
        stage: "QUALITY",
        decision: input.decision,
        submissionVersion: batch.currentSubmissionVersion,
        comment: input.comment ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        batchId,
        actorId: officerId,
        action: `QUALITY_${input.decision}`,
        entityType: "BATCH",
        entityId: batchId,
        metadata: {
          batchCode: batch.batchCode,
          decision: input.decision,
          previousStatus: batch.status,
          newStatus: updatedStatus,
          submissionVersion: batch.currentSubmissionVersion,
          comment: input.comment ?? null,
        },
      },
    });

    return {
      batchId,
      batchCode: batch.batchCode,
      decision: approval.decision,
      stage: approval.stage,
      status: updatedStatus,
      comment: approval.comment,
      submissionVersion: approval.submissionVersion,
      reviewedAt: approval.decidedAt,
    };
  });
};


interface StateReviewParams {
  batchId: string;
  officerId: string;
  input: StateReviewInput;
}

export const submitStateReview = async ({
  batchId,
  officerId,
  input,
}: StateReviewParams) => {
  return await prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        batchCode: true,
        status: true,
        currentSubmissionVersion: true,
      },
    });

    if (!batch) {
      throw new ApprovalError("Batch not found", 404);
    }

    if (batch.status !== "STATE_REVIEW") {
      throw new ApprovalError(
        "Only batches in state review can be reviewed",
        400
      );
    }

    const nextStatus = {
      APPROVED: "APPROVED",
      REJECTED: "REJECTED",
      RETURNED: "RETURNED",
    } as const;

    const updatedStatus = nextStatus[input.decision];

    const updateResult = await tx.batch.updateMany({
      where: {
        id: batchId,
        status: "STATE_REVIEW",
      },
      data: {
        status: updatedStatus,
        ...(input.decision === "RETURNED"
          ? { returnReason: input.comment }
          : {}),
      },
    });

    if (updateResult.count !== 1) {
      throw new ApprovalError(
        "This batch has already been reviewed",
        409
      );
    }

    const approval = await tx.approval.create({
      data: {
        batchId,
        officerId,
        stage: "STATE",
        decision: input.decision,
        submissionVersion: batch.currentSubmissionVersion,
        comment: input.comment ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        batchId,
        actorId: officerId,
        action: `STATE_${input.decision}`,
        entityType: "BATCH",
        entityId: batchId,
        metadata: {
          batchCode: batch.batchCode,
          decision: input.decision,
          previousStatus: batch.status,
          newStatus: updatedStatus,
          submissionVersion: batch.currentSubmissionVersion,
          comment: input.comment ?? null,
        },
      },
    });

    return {
      batchId,
      batchCode: batch.batchCode,
      decision: approval.decision,
      stage: approval.stage,
      status: updatedStatus,
      comment: approval.comment,
      submissionVersion: approval.submissionVersion,
      reviewedAt: approval.decidedAt,
    };
  });
};
