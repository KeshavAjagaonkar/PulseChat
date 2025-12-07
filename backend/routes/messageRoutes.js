import express from "express";
import { allMessages, sendMessage,deleteMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";


const router = express.Router();


router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages);
router.route("/:id").delete(protect, deleteMessage);

export default router;