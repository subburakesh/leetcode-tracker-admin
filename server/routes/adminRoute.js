import express from "express";
import {
  adminLogin,
  adminLogout,
  getMe,
  getAdmins,
  createAdmin,
  updateAdmin,
  changeAdminPassword,
  deleteAdmin,
} from "../controller/adminController.js";
import verifyToken from "../middleware/authMiddleware.js";

const adminRouter = express.Router();

// Authentication endpoints
adminRouter.post("/login", adminLogin);
adminRouter.post("/logout", adminLogout);
adminRouter.get("/me", getMe);

// Admin management endpoints
adminRouter.get("/", verifyToken, getAdmins);
adminRouter.post("/", verifyToken, createAdmin);
adminRouter.put("/:id", verifyToken, updateAdmin);
adminRouter.put("/:id/password", verifyToken, changeAdminPassword);
adminRouter.delete("/:id", verifyToken, deleteAdmin);

export default adminRouter;
