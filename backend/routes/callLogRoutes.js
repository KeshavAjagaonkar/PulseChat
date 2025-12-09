import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    createCallLog,
    getCallLogs,
    deleteCallLog,
} from "../controllers/callLogController.js";

const router = express.Router();

router.route("/")
    .post(protect, createCallLog)
    .get(protect, getCallLogs);

router.route("/:id")
    .delete(protect, deleteCallLog);

export default router;
