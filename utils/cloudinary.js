const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file to Cloudinary
 * @param {String} localFilePath Path to the file on local disk
 * @param {String} folder Optional folder name in Cloudinary
 */
const uploadToCloudinary = async (localFilePath, folder = 'kem_bills') => {
    try {
        if (!localFilePath) return null;

        // Upload the file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: folder
        });

        // File has been uploaded successfully
        // Remove the locally saved temporary file
        fs.unlinkSync(localFilePath);

        return response;
    } catch (error) {
        // Remove the locally saved temporary file as the upload operation failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary upload error:", error);
        return null;
    }
};

module.exports = { uploadToCloudinary };
