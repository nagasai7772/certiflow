#  CertiFlow – Digital Certificate Management System

CertiFlow is a role-based digital certificate management system designed to manage training batches, candidate records, multi-level approval workflows, and automated certificate generation.

The system follows a structured approval process involving Training Centres, District Officers, Quality Officers, and State Officers. Once a batch receives final approval, the system generates individual PDF certificates for its candidates, each containing a unique certificate number and QR-based verification link.

---

## Project Overview

CertiFlow aims to digitize and simplify the complete certificate issuance process.

### Core Features

- Role-based authentication and authorization.
- Training Centre management.
- Batch creation and candidate management.
- Bulk candidate upload using CSV files.
- Candidate data validation.
- Multi-level batch approval workflow.
- District-level verification.
- Quality-level verification.
- State-level final approval.
- Automated PDF certificate generation.
- Unique certificate numbers.
- QR code generation for certificate verification.
- Secure verification tokens with SHA-256 hashing.
- Local PDF certificate storage.
- Audit logging for important operations.
- Duplicate certificate issuance prevention.

---

## Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend framework |
| TypeScript | Type safety |
| PostgreSQL | Relational database |
| Prisma ORM | Database operations |
| @prisma/adapter-pg | PostgreSQL adapter |
| JWT | Authentication |
| Zod | Request and CSV validation |
| Multer | File uploads |
| Papa Parse | CSV parsing |
| PDFKit | PDF certificate generation |
| QRCode | QR code generation |
| Helmet | HTTP security headers |
| CORS | Cross-origin resource sharing |

### Frontend – Planned

| Technology | Purpose |
|---|---|
| React | UI development |
| TypeScript | Type safety |
| Vite | Frontend development and build tool |
| Tailwind CSS | Styling |
| React Router | Client-side routing |
| Axios | Backend API communication |
| TanStack Query | Server-state management |
| Lucide React | Icons |

---

## User Roles

CertiFlow currently supports four user roles.

### 1. Training Centre

Responsibilities:

- Create training batches.
- Upload candidate information through CSV files.
- View batch candidates.
- Submit completed batches for approval.

### 2. District Officer

Responsibilities:

- View submitted batches.
- Verify batch information.
- Approve batches.
- Reject batches.
- Return batches with comments for correction.

### 3. Quality Officer

Responsibilities:

- Review batches approved by District Officers.
- Perform quality verification.
- Approve, reject, or return batches.
- Provide comments when rejecting or returning batches.

### 4. State Officer

Responsibilities:

- Perform final batch verification.
- Approve, reject, or return batches.
- Generate certificates for approved batches.
- Maintain accountability for certificate issuance.

---

## Approval Workflow

A batch moves through the following approval stages:

```text
              TRAINING CENTRE
                     |
                     |
               Create Batch
                     |
                     |
              Upload Candidates
                     |
                     |
               Submit Batch
                     |
                     v
              DISTRICT REVIEW
                     |
          +----------+----------+
          |          |          |
       APPROVE     REJECT     RETURN
          |
          v
              QUALITY REVIEW
                     |
          +----------+----------+
          |          |          |
       APPROVE     REJECT     RETURN
          |
          v
               STATE REVIEW
                     |
          +----------+----------+
          |          |          |
       APPROVE     REJECT     RETURN
          |
          v
              BATCH APPROVED
                     |
                     |
           GENERATE CERTIFICATES
                     |
                     v
             CERTIFICATES ISSUED
```

### Batch Statuses

| Status | Description |
|---|---|
| DRAFT | Batch created but not submitted |
| SUBMITTED | Submitted by Training Centre |
| DISTRICT_REVIEW | Awaiting or undergoing District review |
| QUALITY_REVIEW | Awaiting or undergoing Quality review |
| STATE_REVIEW | Awaiting or undergoing State review |
| RETURNED | Returned for corrections |
| REJECTED | Batch rejected |
| APPROVED | Final approval completed |

**Note:** Returning a batch requires correction and resubmission. The system tracks the submission version to distinguish reviews of different submissions.

---

## Certificate Generation

CertiFlow automatically generates individual PDF certificates for candidates in an approved batch.

### Certificate Generation Process

1. State Officer initiates certificate generation.
2. Backend verifies that the batch exists.
3. Backend checks that the batch status is `APPROVED`.
4. Candidate records are retrieved.
5. Candidates without existing certificates are selected.
6. A unique certificate number is generated for each candidate.
7. A secure verification token is generated.
8. The SHA-256 hash of the token is stored in PostgreSQL.
9. A QR code containing the verification URL is generated.
10. PDF certificates are generated using PDFKit.
11. PDF files are stored locally.
12. Certificate metadata is saved in PostgreSQL.
13. An audit log records the certificate issuance operation.

### Certificate Number Format

```text
CERT-YEAR-CENTRECODE-UNIQUECODE
```

Example:

```text
CERT-2026-CENTRE-HYD-001-3D262EB8
```

### Certificate Information

Each generated certificate contains:

- Candidate name.
- Registration number.
- Training programme name.
- Training Centre name.
- Unique certificate number.
- Issue date.
- QR code for verification.

### Certificate Storage

Generated PDF files are stored locally:

```text
uploads/
└── certificates/
    ├── CERT-2026-CENTRE-HYD-001-3D262EB8.pdf
    ├── CERT-2026-CENTRE-HYD-001-823FBECC.pdf
    └── ...
```

The database stores the relative file path using the `fileKey` field.

### Certificate Security

- Each certificate receives a unique verification token.
- Verification tokens are generated using Node.js cryptographic functions.
- Only the SHA-256 hash is stored in the database.
- Certificate numbers have a unique database constraint.
- Candidate IDs have a unique constraint in the Certificate model.
- Certificate generation is restricted to State Officers.

---

## Backend Architecture

The backend follows a layered architecture separating routes, controllers, services, validation, and database operations.

```text
backend/
│
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   └── db.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── batch.controller.ts
│   │   ├── approval.controller.ts
│   │   └── certificate.controller.ts
│   │
│   ├── services/
│   │   ├── batch.service.ts
│   │   ├── approval.service.ts
│   │   └── certificate.service.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── authorize.middleware.ts
│   │   └── upload.middleware.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── protected.routes.ts
│   │   ├── batch.routes.ts
│   │   ├── approval.routes.ts
│   │   └── certificate.routes.ts
│   │
│   ├── validators/
│   │   ├── batch.validator.ts
│   │   └── approval.validator.ts
│   │
│   ├── types/
│   │   └── express.d.ts
│   │
│   ├── utils/
│   │   └── jwt.ts
│   │
│   └── generated/
│       └── prisma/
│
├── uploads/
│   └── certificates/
│
├── prisma/
│   └── schema.prisma
│
├── .env
├── .gitignore
└── package.json
```

*The structure above reflects the current backend organization; additional files may be added as development continues.*

### Architecture Flow

```text
Client Request
      |
      v
    Routes
      |
      v
  Middleware
      |
      v
  Controllers
      |
      v
   Services
      |
      v
 Prisma ORM
      |
      v
 PostgreSQL
```

---

## Database Design

CertiFlow uses PostgreSQL with Prisma ORM.

### Main Database Models

| Model | Responsibility |
|---|---|
| User | User accounts and role information |
| TrainingCentre | Training Centre details |
| Batch | Training batch information and approval status |
| Candidate | Candidate information |
| Approval | District, Quality, and State approval records |
| AuditLog | System activity tracking |
| Certificate | Generated certificate metadata |
| Notification | Notification records |
| NotificationAttempt | Notification delivery attempt records |

### Important Database Relationships

- A Training Centre can have multiple users.
- A Training Centre can create multiple batches.
- A Batch can contain multiple candidates.
- A Batch can have multiple approval records.
- A Candidate can have one certificate.
- A Batch can have multiple certificates.
- Users can create batches and perform approvals.
- Audit logs track important system activities.

### Important Constraints

- User email must be unique.
- Training Centre code must be unique.
- Batch code is unique within a Training Centre.
- Candidate registration number is unique within a batch.
- A candidate can have only one certificate.
- Certificate number must be unique.
- Verification token hash must be unique.
- Approval records are constrained by batch, submission version, stage, and officer.

---

## API Documentation

Base URL:

```text
http://localhost:5000/api
```

### Authentication

Authentication routes are mounted under:

```text
/api/auth
```

Login is implemented. Refer to the authentication route definitions for the exact login method and path.

### Batch Management

| Method | Endpoint | Description |
|---|---|---|
| POST | `/batches` | Create a batch |
| POST | `/batches/:batchId/submit` | Submit a batch |
| GET | `/batches/:batchId/candidates` | Get batch candidates |

Candidate CSV upload is implemented using the batch upload middleware and service.

### Approval Management

| Method | Endpoint | Authorized Role | Description |
|---|---|---|---|
| POST | `/batches/:batchId/district-review` | DISTRICT_OFFICER | District review |
| POST | `/batches/:batchId/quality-review` | QUALITY_OFFICER | Quality review |
| POST | `/batches/:batchId/state-review` | STATE_OFFICER | Final state review |

### Certificate Management

| Method | Endpoint | Authorized Role | Description |
|---|---|---|---|
| POST | `/certificates/batches/:batchId/issue` | STATE_OFFICER | Generate batch certificates |

### Health Check

```http
GET /api/health
```

Example response:

```json
{
  "success": true,
  "message": "CertiFlow API is running"
}
```

---

## Installation and Setup

### Prerequisites

Install the following:

- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
```

```bash
cd CertiFlow
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Environment Variables

Create a `.env` file inside the backend directory.

Configure the following variables:

```env
DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173

APP_BASE_URL=http://localhost:5000

CERTIFICATE_STORAGE_PATH=uploads/certificates
```

Use the exact additional environment variables required by your existing authentication and server configuration.

### 4. Database Setup

Configure PostgreSQL and your `DATABASE_URL`.

Generate the Prisma Client:

```bash
npx prisma generate
```

Apply the Prisma schema to your development database using your project's migration workflow:

```bash
npx prisma migrate dev --name init
```

### 5. Start Backend

Use the development script defined in `package.json`.

For example, if your project uses `dev`:

```bash
npm run dev
```

Backend base URL:

```text
http://localhost:5000
```

---

## Testing

The backend APIs have been tested using Postman.

### Completed Test Scenarios

- Batch creation.
- Candidate CSV upload.
- Candidate retrieval.
- Batch submission.
- District Officer approval.
- Quality Officer approval.
- State Officer final approval.
- Certificate generation.
- Certificate number generation.
- PDF file creation.
- QR code generation.
- Certificate metadata persistence.

### Certificate Generation Test

Tested batch:

```text
Batch ID:
92d3d8c0-3f1a-464d-8cdb-b43c2e93a7a5

Batch Code:
HYD-2026-002
```

Test result:

```json
{
  "success": true,
  "message": "Certificates generated successfully",
  "data": {
    "batchCode": "HYD-2026-002",
    "totalCandidates": 5,
    "issuedCount": 5
  }
}
```

All five certificates were successfully generated and their records were saved in PostgreSQL.

---

## Current Development Status

### Backend

- [x] Project setup with Node.js and TypeScript.
- [x] Express application configuration.
- [x] PostgreSQL connection using Prisma.
- [x] Authentication and JWT middleware.
- [x] Role-based authorization middleware.
- [x] Batch creation.
- [x] CSV candidate upload.
- [x] Candidate data validation.
- [x] Candidate retrieval.
- [x] Batch submission.
- [x] District Officer review.
- [x] Quality Officer review.
- [x] State Officer review.
- [x] Audit logging for implemented workflows.
- [x] PDF certificate generation.
- [x] Unique certificate number generation.
- [x] QR code generation.
- [x] Secure verification token hashing.
- [x] Local certificate storage.
- [x] Certificate metadata persistence.
- [x] State Officer-only certificate issuance.

### Frontend

- [ ] React + TypeScript + Vite project setup.
- [ ] Tailwind CSS configuration.
- [ ] API integration with Axios.
- [ ] Login interface.
- [ ] Role-based dashboard layouts.
- [ ] Training Centre dashboard.
- [ ] District Officer dashboard.
- [ ] Quality Officer dashboard.
- [ ] State Officer dashboard.
- [ ] Certificate management interface.

### Remaining Backend Features

- [ ] Certificate download API.
- [ ] Public certificate verification API.
- [ ] Certificate cancellation API.
- [ ] Notification integration.
- [ ] WhatsApp notifications.
- [ ] Notification retry and delivery tracking.
- [ ] Cloud certificate storage integration.

---

## Future Improvements

Potential improvements include:

- AWS S3 integration for certificate storage.
- Public certificate verification portal.
- QR-based certificate authenticity verification.
- Certificate cancellation and status management.
- WhatsApp notifications for certificate issuance.
- Email notifications.
- Notification retry mechanisms.
- Advanced reporting and analytics.
- Batch activity history.
- Improved audit and security monitoring.

---

## Development Philosophy

CertiFlow is being developed with a focus on:

- Role-based access control.
- Secure certificate issuance.
- Data consistency.
- Structured approval workflows.
- Maintainable backend architecture.
- Validation at API boundaries.
- Auditability of important operations.
- Scalable certificate storage.

---

## Project Status

**Current Phase:** Backend workflow implementation completed through certificate generation; frontend development and integration are next.

**Backend:** Core batch approval and certificate issuance workflows implemented and tested.

**Frontend:** Not yet developed.

---

## License

This project is currently under development. License and distribution details will be added later.