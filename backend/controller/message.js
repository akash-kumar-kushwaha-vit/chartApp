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
    try {
        const { text } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        // Check if an image is sent along with the message
        let imageUrl = null;
        if (req.file) {
            // we will use multer to upload image to our server temporarily, then to cloudinary
            const response = await uplodcloudinary(req.file.path);
            if(response) {
                imageUrl = response.url;
            }
        }

        if (!text && !imageUrl) {
            throw new ApiError(400, "A message must have text or an image");
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: text || "",
            image: imageUrl,
        });

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(new ApiResponse(201, newMessage, "Message sent successfully"));

    } catch (error) {
        throw new ApiError(500, error.message || "Error in sendMessage controller");
    }
});
