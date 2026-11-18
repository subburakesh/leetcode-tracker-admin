import express from "express";
import {
  getOverview,
  getStudentsSummary,
  getStudentSubmissionDetails,
} from "../controller/dashboardController.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/overview", getOverview);
dashboardRouter.get("/students", getStudentsSummary);
dashboardRouter.get("/students/:id", getStudentSubmissionDetails);

export default dashboardRouter;
