import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

// Load env vars explicitly
dotenv.config();

// Configure Cloudinary with the user's exact variable names
const cloudName = process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDNARY_API_KEY || process.env.CLOUDINARY_API_KEY;  // Note: user has typo CLOUDNARY
const apiSecret = process.env.CLOUDINARY_API_SECRETE || process.env.CLOUDINARY_API_SECRET; // Note: user has SECRETE

// Debug logging
console.log("Cloudinary Config:");
console.log("  Cloud Name:", cloudName ? `✓ ${cloudName}` : "✗ Missing");
console.log("  API Key:", apiKey ? "✓ Set" : "✗ Missing");
console.log("  API Secret:", apiSecret ? "✓ Set" : "✗ Missing");

if (!cloudName || !apiKey || !apiSecret) {
    console.error("\n⚠️  Cloudinary credentials missing! File uploads will fail.\n");
}

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});

// Configure Multer storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folder = 'pulsechat/files';
        let resourceType = 'auto';

        if (file.mimetype.startsWith('image/')) {
            folder = 'pulsechat/images';
            resourceType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
            folder = 'pulsechat/videos';
            resourceType = 'video';
        } else {
            folder = 'pulsechat/documents';
            resourceType = 'raw';
        }

        return {
            folder: folder,
            resource_type: resourceType,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'mp4', 'mov', 'avi', 'mp3', 'wav'],
        };
    },
});

// Create multer upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

// Profile picture storage (images only)
const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'pulsechat/profiles',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    },
});

const uploadProfile = multer({
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for profile pics
    },
});

export { cloudinary, upload, uploadProfile };
