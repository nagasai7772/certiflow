import prisma from "../config/db.js";

import PDFDocument from "pdfkit";
import QRCode from "qrcode";

import { randomBytes, createHash } from "node:crypto";

import { createWriteStream } from "node:fs";

import { mkdir, unlink } from "node:fs/promises";

import path from "node:path";

// ==========================================
// CONFIGURATION
// ==========================================

const STORAGE_PATH = path.resolve(
  process.cwd(),
  process.env.CERTIFICATE_STORAGE_PATH || "uploads/certificates",
);

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5000";

// ==========================================
// CUSTOM ERROR
// ==========================================

export class CertificateError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "CertificateError";
  }
}

// ==========================================
// GENERATE CERTIFICATE NUMBER
// ==========================================

const generateCertificateNumber = (centreCode: string) => {
  const year = new Date().getFullYear();

  const uniqueCode = randomBytes(4).toString("hex").toUpperCase();

  return `CERT-${year}-${centreCode}-${uniqueCode}`;
};

// ==========================================
// GENERATE VERIFICATION TOKEN
// ==========================================

const generateVerificationToken = () => {
  return randomBytes(32).toString("hex");
};

const hashVerificationToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};

// ==========================================
// GENERATE PDF
// ==========================================

interface GeneratePDFParams {
  candidateName: string;
  registrationNumber: string;
  batchName: string;
  centreName: string;
  certificateNumber: string;
  issuedAt: Date;
  verificationUrl: string;
  filePath: string;
}

const generateCertificatePDF = async ({
  candidateName,
  registrationNumber,
  batchName,
  centreName,
  certificateNumber,
  issuedAt,
  verificationUrl,
  filePath,
}: GeneratePDFParams): Promise<void> => {
  const qrCode = await QRCode.toBuffer(verificationUrl, {
    type: "png",
    width: 180,
    margin: 1,
  });

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    const output = createWriteStream(filePath);

    doc.on("error", reject);
    output.on("error", reject);
    output.on("finish", resolve);

    doc.pipe(output);

    // Certificate border
    doc.lineWidth(3).strokeColor("#0B1220").rect(25, 25, 792, 545).stroke();

    doc.lineWidth(1).strokeColor("#0E7C7B").rect(35, 35, 772, 525).stroke();

    // Heading
    doc
      .font("Helvetica-Bold")
      .fontSize(30)
      .fillColor("#0B1220")
      .text("CERTIFICATE OF COMPLETION", 60, 85, {
        align: "center",
      });

    doc.font("Helvetica").fontSize(13).fillColor("#64748B").text("CERTIFLOW", {
      align: "center",
    });

    doc.moveDown(2);

    doc
      .fontSize(17)
      .fillColor("#334155")
      .text("This certificate is proudly presented to", {
        align: "center",
      });

    doc.moveDown(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(29)
      .fillColor("#0E7C7B")
      .text(candidateName, {
        align: "center",
      });

    doc.moveDown(1);

    doc
      .font("Helvetica")
      .fontSize(14)
      .fillColor("#334155")
      .text("For successfully completing the training programme", {
        align: "center",
      });

    doc.moveDown(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(19)
      .fillColor("#0B1220")
      .text(batchName, {
        align: "center",
      });

    doc.moveDown(1);

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#64748B")
      .text(`Training Centre: ${centreName}`, {
        align: "center",
      });

    doc.moveDown(1);

    doc.fontSize(11).text(`Registration Number: ${registrationNumber}`, {
      align: "center",
    });

    // Certificate number and issue date
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#0B1220")
      .text(`Certificate No: ${certificateNumber}`, 65, 470);

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`Issued On: ${issuedAt.toLocaleDateString("en-IN")}`, 65, 490);

    // QR code
    doc.image(qrCode, 680, 440, {
      fit: [85, 85],
    });

    doc.fontSize(8).fillColor("#64748B").text("Scan to verify", 680, 530, {
      width: 85,
      align: "center",
    });

    doc.end();
  });
};

// ==========================================
// ISSUE CERTIFICATES
// ==========================================
interface IssuedCertificateData {
  certificateNumber: string;
  verificationTokenHash: string;
  candidateId: string;
  batchId: string;
  fileKey: string;
  issuedAt: Date;
}

interface IssueCertificatesParams {
  batchId: string;
  issuedById: string;
}
export const issueBatchCertificates = async ({
  batchId,
  issuedById,
}: IssueCertificatesParams) => {
  const createdFiles: string[] = [];

  try {
    // 1. Fetch approved batch
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        trainingCentre: true,
        candidates: {
          include: {
            certificate: true,
          },
        },
      },
    });

    if (!batch) {
      throw new CertificateError("Batch not found", 404);
    }

    // 2. Verify batch status
    if (batch.status !== "APPROVED") {
      throw new CertificateError(
        "Certificates can only be generated for approved batches",
        400,
      );
    }

    if (batch.candidates.length === 0) {
      throw new CertificateError("No candidates found in this batch", 400);
    }

    // 3. Select candidates without certificates
    const pendingCandidates = batch.candidates.filter(
      (candidate) => !candidate.certificate,
    );

    if (pendingCandidates.length === 0) {
      return {
        batchId,
        batchCode: batch.batchCode,
        totalCandidates: batch.candidates.length,
        issuedCount: 0,
        message: "Certificates have already been issued to all candidates",
        certificates: [],
      };
    }

    // 4. Create storage directory
    await mkdir(STORAGE_PATH, {
      recursive: true,
    });

    const issuedCertificates: IssuedCertificateData[] = [];

    // 5. Generate certificates
    for (const candidate of pendingCandidates) {
      const certificateNumber = generateCertificateNumber(
        batch.trainingCentre.code,
      );

      const verificationToken = generateVerificationToken();

      const verificationTokenHash = hashVerificationToken(verificationToken);

      const issuedAt = new Date();

      const verificationUrl = `${APP_BASE_URL}/api/certificates/verify/${verificationToken}`;

      const fileName = `${certificateNumber}.pdf`;

      const filePath = path.join(STORAGE_PATH, fileName);

      const fileKey = path
        .relative(process.cwd(), filePath)
        .split(path.sep)
        .join("/");

      // Generate PDF
      createdFiles.push(filePath);

      await generateCertificatePDF({
        candidateName: candidate.fullName,
        registrationNumber: candidate.registrationNumber,
        batchName: batch.name,
        centreName: batch.trainingCentre.name,
        certificateNumber,
        issuedAt,
        verificationUrl,
        filePath,
      });


      issuedCertificates.push({
        certificateNumber,
        verificationTokenHash,
        candidateId: candidate.id,
        batchId: batch.id,
        fileKey,
        issuedAt,
      });
    }

    // 6. Save certificate records atomically
    const savedCertificates = await prisma.$transaction(async (tx) => {
      const records = [];

      for (const certificate of issuedCertificates) {
        const record = await tx.certificate.create({
          data: certificate,
          select: {
            id: true,
            certificateNumber: true,
            candidateId: true,
            fileKey: true,
            status: true,
            issuedAt: true,
          },
        });

        records.push(record);
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          batchId,
          actorId: issuedById,
          action: "CERTIFICATES_ISSUED",
          entityType: "BATCH",
          entityId: batchId,
          metadata: {
            issuedCount: records.length,
            submissionVersion: batch.currentSubmissionVersion,
          },
        },
      });

      return records;
    });

    return {
      batchId,
      batchCode: batch.batchCode,
      totalCandidates: batch.candidates.length,
      issuedCount: savedCertificates.length,
      certificates: savedCertificates,
    };
  } catch (error) {
    // Remove generated PDFs if database operation fails
    await Promise.all(
      createdFiles.map((file) => unlink(file).catch(() => undefined)),
    );

    if (error instanceof CertificateError) {
      throw error;
    }

    throw error;
  }
};
