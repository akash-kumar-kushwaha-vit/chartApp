import { Message } from "../model/message.model.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../utility/apiError.js";
import mongoose from "mongoose";
import { ApiResponse } from "../utility/apiResponse.js";
import { asyncHandler } from "../utility/asyncHandler.js";
import uplodcloudinary from "../utility/cloudinary.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { getLinkPreview } from "link-preview-js";

export const getMessages = asyncHandler(async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;
        const { limit = 50, skip = 0, search = '', isGroup = 'false' } = req.query;

        let query = {};

        if (isGroup === 'true') {
            query = { groupId: userToChatId };
        } else {
            // Auto-mark as read when fetched initially without search
            if (parseInt(skip) === 0 && !search) {
                const updated = await Message.updateMany(
                    { senderId: userToChatId, receiverId: myId, status: { $ne: "read" } },
                    { $set: { status: "read" } }
                );

                if (updated.modifiedCount > 0) {
                    const senderSocketId = getReceiverSocketId(userToChatId);
                    if (senderSocketId) {
                        io.to(senderSocketId).emit("messagesRead", { readerId: myId });
                    }
                }
            }

            query = {
                $or: [
                    { senderId: myId, receiverId: userToChatId },
                    { senderId: userToChatId, receiverId: myId },
                ],
            };
        }

        if (search) {
            query.text = { $regex: search, $options: 'i' };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .populate('replyTo', 'text image video fileUrl fileName audioUrl status senderId')
            .populate('senderId', 'fullName avtar');

        res.status(200).json(new ApiResponse(200, messages.reverse(), "Messages fetched"));
    } catch (error) {
        throw new ApiError(500, "Error in getMessages controller");
    }
});

export const sendMessage = asyncHandler(async (req, res) => {
    const { text, replyTo, isGroup, isForwarded, imageURL, videoURL, fileURL, fileNameStr, audioURL, iv, encryptionKeys } = req.body;
    const { id: targetId } = req.params;
    const senderId = req.user._id;

    // Handle image upload
    let imageUrl = imageURL || null;
    if (req.files && req.files.image && req.files.image[0]) {
        const response = await uplodcloudinary(req.files.image[0].path, "image");
        if (response) {
            imageUrl = response.url;
        } else {
            throw new ApiError(500, "Failed to upload image");
        }
    }

    // Handle video upload
    let videoUrl = videoURL || null;
    if (req.files && req.files.video && req.files.video[0]) {
        const response = await uplodcloudinary(req.files.video[0].path, "video");
        if (response) {
            videoUrl = response.url;
        } else {
            throw new ApiError(500, "Failed to upload video");
        }
    }

    // Handle file upload
    let fileUrl = fileURL || null;
    let fileName = fileNameStr || null;
    if (req.files && req.files.file && req.files.file[0]) {
        const response = await uplodcloudinary(req.files.file[0].path, "auto");
        if (response) {
            fileUrl = response.url;
            fileName = req.files.file[0].originalname;
        } else {
            throw new ApiError(500, "Failed to upload file");
        }
    }

    // Handle audio upload
    let audioUrl = audioURL || null;
    if (req.files && req.files.audio && req.files.audio[0]) {
        const response = await uplodcloudinary(req.files.audio[0].path, "video");
        if (response) {
            audioUrl = response.url;
        } else {
            throw new ApiError(500, "Failed to upload audio");
        }
    }

    if (!text && !imageUrl && !videoUrl && !fileUrl && !audioUrl) {
        throw new ApiError(400, "A message must have text, an image, a video, an audio note, or a file");
    }

    // Attempt to fetch link preview if text contains a URL
    let linkPreviewData = null;
    if (text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex);
        if (matches && matches.length > 0) {
            try {
                const preview = await getLinkPreview(matches[0], {
                    timeout: 3000,
                    headers: {
                        "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
                    }
                });
                if (preview && preview.title) {
                    linkPreviewData = {
                        title: preview.title,
                        description: preview.description || "",
                        image: preview.images && preview.images.length > 0 ? preview.images[0] : null,
                        url: preview.url || matches[0]
                    };
                }
            } catch (err) {
                console.error("Link preview fetch error:", err.message || err);
            }
        }
    }

    const messageData = {
        senderId,
        text: text || "",
        image: imageUrl,
        video: videoUrl,
        fileUrl: fileUrl,
        fileName: fileName,
        audioUrl: audioUrl,
        replyTo: replyTo || null,
        isForwarded: isForwarded || false,
        linkPreview: linkPreviewData,
        status: "sent"
    };

    if (iv) messageData.iv = iv;
    if (encryptionKeys) {
        try {
            messageData.encryptionKeys = typeof encryptionKeys === 'string' ? JSON.parse(encryptionKeys) : encryptionKeys;
        } catch (e) {
            console.error("Failed to parse encryptionKeys");
        }
    }

    const isGroupBoolean = isGroup === 'true' || isGroup === true;

    if (isGroupBoolean) {
        messageData.groupId = targetId;
    } else {
        messageData.receiverId = targetId;
        if (getReceiverSocketId(targetId)) {
            messageData.status = "delivered";
        }
    }

    const newMessage = await Message.create(messageData);

    await newMessage.populate('replyTo', 'text image video fileUrl fileName audioUrl status senderId');
    await newMessage.populate('senderId', 'fullName avtar');

    if (isGroupBoolean) {
        io.to(targetId.toString()).emit("newMessage", newMessage);
    } else {
        const receiverSocketId = getReceiverSocketId(targetId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
    }

    res.status(201).json(new ApiResponse(201, newMessage, "Message sent successfully"));
});

export const editMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const senderId = req.user._id;

    if (!text) {
        throw new ApiError(400, "Text is required to edit a message");
    }

    const message = await Message.findById(id);

    if (!message) throw new ApiError(404, "Message not found");
    if (message.senderId.toString() !== senderId.toString()) throw new ApiError(403, "You can only edit your own messages");
    if (message.isDeleted) throw new ApiError(400, "Cannot edit a deleted message");

    message.text = text;
    message.isEdited = true;
    await message.save();

    await message.populate('replyTo', 'text image video fileUrl fileName senderId');

    if (message.groupId) {
        io.to(message.groupId.toString()).emit("messageEdited", message);
    } else {
        const receiverSocketId = getReceiverSocketId(message.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageEdited", message);
        }
    }

    res.status(200).json(new ApiResponse(200, message, "Message edited successfully"));
});

export const deleteMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const senderId = req.user._id;

    const message = await Message.findById(id);

    if (!message) throw new ApiError(404, "Message not found");
    if (message.senderId.toString() !== senderId.toString()) throw new ApiError(403, "You can only delete your own messages");

    message.isDeleted = true;
    message.text = "This message was deleted";
    message.image = null;
    message.video = null;
    message.audioUrl = null;
    message.fileUrl = null;
    message.fileName = null;
    await message.save();

    if (message.groupId) {
        io.to(message.groupId.toString()).emit("messageDeleted", message);
    } else {
        const receiverSocketId = getReceiverSocketId(message.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeleted", message);
        }
    }

    res.status(200).json(new ApiResponse(200, message, "Message deleted successfully"));
});

export const reactToMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) throw new ApiError(400, "Emoji is required");

    const message = await Message.findById(id);
    if (!message) throw new ApiError(404, "Message not found");

    // Check if user already reacted
    const existingReactionIndex = message.reactions.findIndex(r => r.userId.toString() === userId.toString());

    if (existingReactionIndex > -1) {
        if (message.reactions[existingReactionIndex].emoji === emoji) {
            // Toggle off if same emoji
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            // Change emoji
            message.reactions[existingReactionIndex].emoji = emoji;
        }
    } else {
        message.reactions.push({ userId, emoji });
    }

    await message.save();
    await message.populate('replyTo', 'text image video fileUrl fileName audioUrl status senderId');

    if (message.groupId) {
        io.to(message.groupId.toString()).emit("messageReacted", message);
    } else {
        const receiverSocketId = getReceiverSocketId(message.senderId.toString() === userId.toString() ? message.receiverId : message.senderId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageReacted", message);
        }
    }

    res.status(200).json(new ApiResponse(200, message, "Reaction updated"));
});

export const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { id: senderId } = req.params;
    const myId = req.user._id;

    await Message.updateMany(
        { senderId: senderId, receiverId: myId, status: { $ne: "read" } },
        { $set: { status: "read" } }
    );

    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", { readerId: myId });
    }

    res.status(200).json(new ApiResponse(200, null, "Messages marked as read"));
});

export const getUnreadCounts = asyncHandler(async (req, res) => {
    const myId = req.user._id;

    const unreadCounts = await Message.aggregate([
        { $match: { receiverId: new mongoose.Types.ObjectId(myId), status: { $ne: "read" } } },
        { $group: { _id: "$senderId", count: { $sum: 1 } } }
    ]);

    const formattedCounts = {};
    unreadCounts.forEach(item => {
        formattedCounts[item._id.toString()] = item.count;
    });

    res.status(200).json(new ApiResponse(200, formattedCounts, "Unread counts fetched"));
});
