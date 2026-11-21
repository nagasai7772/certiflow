import { Router } from "express";
import { createBatchController, uploadCandidatesController,getCandidatesByBatchController, submitBatchController } from "../controllers/batch.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorize.middleware.js";
import { uploadCsv } from "../middleware/upload.middleware.js";

const batchRoutes = Router();




batchRoutes.post(
  "/",
  authMiddleware,
  authorizeRoles("TRAINING_CENTRE"),
  createBatchController
);


// Upload candidate CSV
batchRoutes.post(
  "/:batchId/candidates/upload",
  authMiddleware,
  authorizeRoles("TRAINING_CENTRE"),
  uploadCsv,
  uploadCandidatesController
);

batchRoutes.get(
  "/:batchId/candidates",
  authMiddleware,
  authorizeRoles("TRAINING_CENTRE"),
  getCandidatesByBatchController
);
batchRoutes.post(
  "/:batchId/submit",
  authMiddleware,
  authorizeRoles("TRAINING_CENTRE"),
  submitBatchController
);

export default batchRoutes;