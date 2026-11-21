# CertiFlow Frontend

React + TypeScript + Vite frontend for the CertiFlow digital certificate management system.

## Features included

- Login screen with JWT bearer-token handling.
- Role-aware navigation for Training Centre, District Officer, Quality Officer, and State Officer.
- Dashboard with batch summary cards and approval journey.
- Batch list with search and status filter.
- Training Centre batch creation and CSV upload UI.
- Candidate roster and batch submission UI.
- District, Quality, and State review queues with approve / return / reject decisions.
- State Officer certificate issuance UI.
- Responsive desktop and mobile layouts.

## Requirements

- Node.js 18+
- npm
- CertiFlow backend running locally (default `http://localhost:5000`)

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:5173`.

Build for production:

```bash
npm run build
```

## Backend connection

The Axios instance is in `src/lib/http.ts`. It sends:

```http
Authorization: Bearer <token>
```

when `certiflow_token` exists in local storage.

The API path map is centralized in `src/config/api.ts`.

### Important: verify these API contracts

The frontend was generated from the backend endpoints and workflow shared during development. Some backend route details were not available, so check these before using the UI end-to-end:

1. Login path defaults to `POST /api/auth/login`. Confirm the actual path and response format in your auth route/controller.
2. Batch list defaults to `GET /api/batches`. The backend list endpoint was not confirmed in the shared implementation. Add it or adjust the frontend mapping.
3. CSV upload defaults to `POST /api/batches/:batchId/upload` with multipart field `file`. Confirm the exact path in `batch.routes.ts`.
4. Batch creation sends `{ "batchCode": "...", "name": "..." }`. Confirm the exact Zod schema in `batch.validator.ts`.
5. Login response should contain a user and token. If your backend uses another shape, update `src/services/auth.service.ts`.
6. Candidate list responses are expected as an array, `{ "data": [...] }`, or `{ "candidates": [...] }`.
7. Review bodies are sent as `{ "decision": "APPROVED" | "REJECTED" | "RETURNED", "comment": "..." }`.

All API paths can be adjusted in `src/config/api.ts`.

## Roles

| Role | Main frontend access |
|---|---|
| `TRAINING_CENTRE` | Overview, batches, create batch, candidate upload, submission |
| `DISTRICT_OFFICER` | Overview, batches, district review |
| `QUALITY_OFFICER` | Overview, batches, quality review |
| `STATE_OFFICER` | Overview, batches, state review, certificate issuance |

Role restrictions in the frontend improve navigation and usability. The backend must remain the source of truth for authorization.

## Project structure

```text
src/
├── components/
│   ├── AppLayout.tsx
│   ├── ProtectedRoute.tsx
│   └── StatusBadge.tsx
├── config/
│   └── api.ts
├── context/
│   └── AuthContext.tsx
├── lib/
│   └── http.ts
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── BatchesPage.tsx
│   ├── CreateBatchPage.tsx
│   ├── BatchDetailsPage.tsx
│   ├── ReviewPage.tsx
│   └── CertificatesPage.tsx
├── services/
│   ├── auth.service.ts
│   └── batch.service.ts
├── types/
│   └── index.ts
├── App.tsx
├── index.css
└── main.tsx
```

## Notes

- Certificate issuance calls the implemented `POST /api/certificates/batches/:batchId/issue` endpoint.
- Certificate download and public QR verification are not included because those backend endpoints have not yet been implemented.
- The frontend expects backend CORS to allow `http://localhost:5173`.
- The login flow currently stores the JWT in local storage. For production, consider an HttpOnly secure cookie strategy if supported by the backend.
