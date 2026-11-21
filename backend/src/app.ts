
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { login } from "./controllers/auth.controller";
import router from "./routes/protected.routes";
import batchRoutes from "./routes/batch.routes";
import approvalRoutes from "./routes/approval.routes";
import certificateRoutes from "./routes/certificate.routes";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", login);
app.use("/api/protected", router);
app.use("/api/batches", batchRoutes);
app.use("/api", approvalRoutes);
app.use("/api/certificates", certificateRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "CertiFlow API is running",
  });
});

export default app;
