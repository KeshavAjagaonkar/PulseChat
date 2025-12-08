import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload, uploadProfile, cloudinary } from "../config/cloudinary.js";

const router = express.Router();

// Upload file for chat messages (images, documents, videos)
router.post("/file", protect, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Get file info from Cloudinary response
        const fileUrl = req.file.path;
        const fileType = req.file.mimetype?.startsWith("image/")
            ? "image"
            : req.file.mimetype?.startsWith("video/")
                ? "video"
                : "document";

        const fileName = req.file.originalname;
        const fileSize = req.file.size || 0;

        // For documents (raw files), manually construct download URL
        // The correct format is: https://res.cloudinary.com/{cloud}/raw/upload/fl_attachment/{version}/{public_id}
        let downloadUrl = fileUrl;
        if (fileType === "document") {
            // Insert fl_attachment flag after /upload/
            downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
        }

        console.log("File upload success:", { type: fileType, name: fileName, size: fileSize });
        console.log("URLs:", { url: fileUrl, downloadUrl: downloadUrl });

        res.json({
            url: fileUrl,
            downloadUrl: downloadUrl,
            type: fileType,
            name: fileName,
            size: fileSize,
            publicId: req.file.filename,
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Failed to upload file" });
    }
});

// Upload profile picture
router.post("/profile-pic", protect, uploadProfile.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image uploaded" });
        }

        const imageUrl = req.file.path;

        res.json({
            url: imageUrl,
            publicId: req.file.filename,
        });
    } catch (error) {
        console.error("Profile upload error:", error);
        res.status(500).json({ message: "Failed to upload profile picture" });
    }
});

export default router;
