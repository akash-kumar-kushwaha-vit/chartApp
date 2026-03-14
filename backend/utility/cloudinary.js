import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uplodcloudinary = async (localfile, resourceType = "auto") => {
    try {
        const response = await cloudinary.uploader.upload(localfile, {
            resource_type: resourceType,
            type: "upload",
            // For raw files, add an attachment flag if possible
            // Note: Cloudinary restricts viewing raw files by default for security, 
            // you might need to use `fl_attachment` in the URL or set it during upload
        })
        console.log("File uploaded successfully:", response.url)
        fs.unlinkSync(localfile)
        return response
    } catch (error) {
        fs.unlinkSync(localfile);
        console.error("Error uploading file:", error)
        return null
    }
}
export default uplodcloudinary;