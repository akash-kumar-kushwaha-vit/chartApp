import { Message } from "../model/message.model.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../utility/apiError.js";
import { ApiResponse } from "../utility/apiResponse.js";
import { asyncHandler } from "../utility/asyncHandler.js";
import uplodcloudinary from "../utility/cloudinary.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
export const getMessages = asyncHandler(async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        }).sort({ createdAt: 1 }); // Sort by chronological order

        res.status(200).json(new ApiResponse(200, messages, "Messages fetched"));
    } catch (error) {
        throw new ApiError(500, "Error in getMessages controller");
    }
});

export const sendMessage = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Handle image upload
    let imageUrl = null;
    if (req.files && req.files.image && req.files.image[0]) {
        const response = await uplodcloudinary(req.files.image[0].path, "image");
        if (response) {
            imageUrl = response.url;
        } else {
            throw new ApiError(500, "Failed to upload image");
        }
    }

    // Handle video upload
    let videoUrl = null;
    if (req.files && req.files.video && req.files.video[0]) {
        const response = await uplodcloudinary(req.files.video[0].path, "video");
        if (response) {
            videoUrl = response.url;
        } else {
            throw new ApiError(500, "Failed to upload video");
        }
    }

    // Handle file upload
    let fileUrl = null;
    let fileName = null;
    if (req.files && req.files.file && req.files.file[0]) {
        const response = await uplodcloudinary(req.files.file[0].path, "auto");
        if (response) {
            fileUrl = response.url;
            fileName = req.files.file[0].originalname;
        } else {
            throw new ApiError(500, "Failed to upload file");
        }
    }

    if (!text && !imageUrl && !videoUrl && !fileUrl) {
        throw new ApiError(400, "A message must have text, an image, a video, or a file");
    }

    const newMessage = await Message.create({
        senderId,
        receiverId,
        text: text || "",
        image: imageUrl,
        video: videoUrl,
        fileUrl: fileUrl,
        fileName: fileName,
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(new ApiResponse(201, newMessage, "Message sent successfully"));
});

