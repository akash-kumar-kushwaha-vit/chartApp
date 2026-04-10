import { Group } from "../model/group.model.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../utility/apiError.js";
import { ApiResponse } from "../utility/apiResponse.js";
import { asyncHandler } from "../utility/asyncHandler.js";
import { io, getReceiverSocketId } from "../socket/socket.js";
import uplodcloudinary from "../utility/cloudinary.js";

// Create a new group
export const createGroup = asyncHandler(async (req, res) => {
    const { name, description, members } = req.body;
    let { avtar } = req.body;
    const myId = req.user._id;

    if (!name) throw new ApiError(400, "Group name is required");
    
    // Parse members if it's sent as stringified array (if FormData is used)
    let parsedMembers = [];
    if (members) {
        try {
            parsedMembers = typeof members === 'string' ? JSON.parse(members) : members;
        } catch (e) {
            parsedMembers = members.split(','); // Fallback
        }
    }

    // Ensure creator is in the group and unique
    const uniqueMembers = [...new Set([...parsedMembers, myId.toString()])];

    if (uniqueMembers.length < 2) {
        throw new ApiError(400, "Group must have at least 2 members");
    }

    // Handle avatar upload if provided
    if (req.file) {
        const response = await uplodcloudinary(req.file.path);
        avtar = response?.secure_url || response?.url;
    } else if (avtar) {
        // base64 image flow
        const response = await uplodcloudinary(avtar);
        avtar = response?.secure_url || response?.url;
    }

    const newGroup = await Group.create({
        name,
        description,
        avtar,
        admins: [myId],
        members: uniqueMembers,
        createdBy: myId
    });

    // Notify members immediately so they can dynamically join the socket room
    uniqueMembers.forEach((memberId) => {
        const socketId = getReceiverSocketId(memberId.toString());
        if (socketId) {
            io.to(socketId).emit("newGroupCreated", newGroup);
        }
    });

    return res.status(201).json(new ApiResponse(201, newGroup, "Group created successfully"));
});

export const updateGroupInfo = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { name, description } = req.body;
    let { avtar } = req.body;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (!group.admins.includes(myId)) {
        throw new ApiError(403, "Only admins can update group info");
    }

    if (req.file) {
        const response = await uplodcloudinary(req.file.path);
        avtar = response?.secure_url || response?.url;
    } else if (avtar && avtar.startsWith('data:image')) {
        const response = await uplodcloudinary(avtar);
        avtar = response?.secure_url || response?.url;
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (avtar) group.avtar = avtar;

    await group.save();

    // Broadcast update
    io.to(groupId).emit("groupUpdated", group);

    return res.status(200).json(new ApiResponse(200, group, "Group updated successfully"));
});

export const addMembers = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { members } = req.body; // array of user IDs
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (!group.admins.includes(myId)) {
        throw new ApiError(403, "Only admins can add members");
    }

    const uniqueNewMembers = members.filter(id => !group.members.includes(id));
    group.members.push(...uniqueNewMembers);
    await group.save();

    io.to(groupId).emit("groupUpdated", group);

    return res.status(200).json(new ApiResponse(200, group, "Members added successfully"));
});

export const removeMember = asyncHandler(async (req, res) => {
    const { groupId, userId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    // Only allow if removing yourself (leave) OR if you are an admin
    if (myId.toString() !== userId && !group.admins.includes(myId)) {
        throw new ApiError(403, "Only admins can remove members");
    }
    
    // Prevent removing the last admin unless there's someone else, 
    // but for simplicity we just proceed
    group.members = group.members.filter(id => id.toString() !== userId);
    group.admins = group.admins.filter(id => id.toString() !== userId);
    await group.save();

    io.to(groupId).emit("groupUpdated", group);

    return res.status(200).json(new ApiResponse(200, group, "Member removed successfully"));
});

export const getGroupDetails = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
        .populate("members", "fullName username avtar email")
        .populate("createdBy", "fullName username");

    if (!group) throw new ApiError(404, "Group not found");

    return res.status(200).json(new ApiResponse(200, group, "Group details fetched successfully"));
});

export const assignAdmin = asyncHandler(async (req, res) => {
    const { groupId, userId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (!group.admins.includes(myId)) {
        throw new ApiError(403, "Only admins can assign new admins");
    }

    if (!group.members.includes(userId)) {
        throw new ApiError(400, "User is not a member of this group");
    }

    if (!group.admins.includes(userId)) {
        group.admins.push(userId);
        await group.save();
        io.to(groupId).emit("groupUpdated", group);
    }

    return res.status(200).json(new ApiResponse(200, group, "Admin assigned successfully"));
});
