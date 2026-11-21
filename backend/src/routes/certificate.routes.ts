
import { Router } from "express";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorize.middleware.js";

import {
  issueBatchCertificatesController,
} from "../controllers/certificate.controller.js";

const certificateRoutes = Router();

certificateRoutes.post(
  "/batches/:batchId/issue",
  authMiddleware,
  authorizeRoles("STATE_OFFICER"),
  issueBatchCertificatesController
);

export default certificateRoutes;
