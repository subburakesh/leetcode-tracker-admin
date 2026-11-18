import express from "express";

import { adminLogin, createAdmin } from "../controller/adminController.js";

const adminRouter = express.Router();

adminRouter.post("/login", adminLogin);
adminRouter.post("/", createAdmin);

export default adminRouter;
