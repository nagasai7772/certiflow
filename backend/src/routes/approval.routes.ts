
import { Router } from "express";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorize.middleware.js";

import {
  districtReviewController,
  qualityReviewController,
  stateReviewController,
} from "../controllers/approval.controller.js";

const approvalRoutes = Router();

approvalRoutes.post(
  "/batches/:batchId/district-review",
  authMiddleware,
  authorizeRoles("DISTRICT_OFFICER"),
  districtReviewController
);

approvalRoutes.post(
  "/batches/:batchId/quality-review",
  authMiddleware,
  authorizeRoles("QUALITY_OFFICER"),
  qualityReviewController
);



approvalRoutes.post(
  "/batches/:batchId/state-review",
  authMiddleware,
  authorizeRoles("STATE_OFFICER"),
  stateReviewController
);

export default approvalRoutes;
