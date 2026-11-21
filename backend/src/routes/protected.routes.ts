import { Router } from "express";
import  {authMiddleware}  from "../middleware/auth.middleware";
import  {authorizeRoles}  from "../middleware/authorize.middleware.js";

const router = Router();

// Any authenticated user
router.get("/profile", authMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authenticated successfully",
    data: {
      user: req.user,
    },
  });
});

// District officers only
router.get(
  "/district",
  authMiddleware,
  authorizeRoles("DISTRICT_OFFICER"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "District officer access granted",
      data: {
        user: req.user,
      },
    });
  }
);

// State officers only
router.get(
  "/state",
  authMiddleware,
  authorizeRoles("STATE_OFFICER"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "State officer access granted",
      data: {
        user: req.user,
      },
    });
  }
);

export default router;