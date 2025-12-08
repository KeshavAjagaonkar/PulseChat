import express from "express";
import { allUsers, updateProfile, getProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, allUsers);
router.route("/profile").get(protect, getProfile).put(protect, updateProfile);

export default router;