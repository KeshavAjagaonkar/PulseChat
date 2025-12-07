import express from "express";
import { allUsers } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, allUsers);

export default router;