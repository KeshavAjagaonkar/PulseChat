import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} from "../controllers/chatController.js";

const router = express.Router();

// 1. Chat Access Routes
router.route("/").post(protect, accessChat); // Create or retrieve 1-on-1 chat
router.route("/").get(protect, fetchChats);  // Get all chats for the sidebar

// 2. Group Management Routes
router.route("/group").post(protect, createGroupChat);       // Create a group
router.route("/rename").put(protect, renameGroup);           // Rename a group
router.route("/groupadd").put(protect, addToGroup);          // Add someone
router.route("/groupremove").put(protect, removeFromGroup);  // Kick someone

export default router;