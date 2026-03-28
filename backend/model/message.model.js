import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            // Made optional to support groupId instead
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            default: null,
        },
        text: {
            type: String,
        },
        image: {
            type: String,
        },
        video: {
            type: String
        },
        fileUrl: {
            type: String
        },
        fileName: {
            type: String
        },
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        reactions: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            emoji: String
        }],
        isEdited: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        audioUrl: {
            type: String,
        },
        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            default: "sent",
        },
        isForwarded: {
            type: Boolean,
            default: false,
        },
        linkPreview: {
            title: String,
            description: String,
            image: String,
            url: String,
        },
        iv: {
            type: String, // Base64 encoded Initialization Vector for AES-GCM
        },
        encryptionKeys: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            encryptedKey: String // Base64 encoded AES key encrypted with the user's RSA public key
        }],
        seen: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
