import { User } from "../model/user.model.js"
import { Group } from "../model/group.model.js";
import { asyncHandler } from "../utility/asyncHandler.js"
import { ApiResponse } from "../utility/apiResponse.js";
import { OAuth2Client } from "google-auth-library";
import { v2 as cloudinary } from "cloudinary";
import { sendEmail } from "../utility/sendEmail.js";
import { ApiError } from "../utility/apiError.js";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const generateAccessTokenAndrefreshToken = async (userId) => {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.REFRESH_TOKEN = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
}

const register = asyncHandler(async (req, res) => {
    const { username, email, fullName, password } = req.body;
    if (!username || !email || !fullName || !password) {
        throw new ApiError(401, "fill all the filelds")
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = await User.create({
        username,
        fullName,
        email,
        password,
        verificationCode,
        verificationCodeExpires,

    })

    try {
        await sendEmail({
            email: user.email,
            subject: "Verify Your Email - Chat App",
            message: `Your verification code is: ${verificationCode}\nIt will expire in 10 minutes.`,
        });
    } catch (error) {
        // If email fails, delete the user so they can try again or handle it differently
        await User.findByIdAndDelete(user._id);
        throw new ApiError(500, "Failed to send verification email. Please try again.");
    }

    const usercreated = await User.findById(user._id).select(
        "-password -verificationCode -verificationCodeExpires"
    )
    if (!usercreated) throw new ApiError(500, "registrion failed! something went wrong")

    return res.status(201).json(
        new ApiResponse(200, usercreated, "User created successfully. Please verify your email to login.")
    )


})
const login = asyncHandler(async (req, res) => {
    // take a user input
    // check in mongodb 
    //check password
    // insert refreshToken and accessToken
    // login
    const { email, password } = req.body;

    const existUser = await User.findOne({ email: email })
    if (!existUser) throw new ApiError(402, "user are not found")

    if (!existUser.isVerified) {
        throw new ApiError(403, "Please verify your email before logging in.");
    }

    const isPasswordValid = await existUser.isPasswordCorrect(password)
    if (!isPasswordValid) throw new ApiError(401, "Invalid password")

    const { accessToken, refreshToken } = await generateAccessTokenAndrefreshToken(existUser._id);
    const option = {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    }

    res.cookie("ACCESS_TOKEN", accessToken, option);
    res.cookie("REFRESH_TOKEN", refreshToken, option);

    const loggedInUser = await User.findById(existUser._id).select("-password -REFRESH_TOKEN");

    return res.status(200).json(
        new ApiResponse(200, { accessToken, refreshToken, user: loggedInUser }, "userlogin successfully")
    )
})
const logout = asyncHandler(async (req, res) => {
    // find user and clear refresh token
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                REFRESH_TOKEN: 1 // this removes the field
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    }

    return res
        .status(200)
        .clearCookie("ACCESS_TOKEN", options)
        .clearCookie("REFRESH_TOKEN", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const getUsersForSidebar = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user._id;
    const { search } = req.query;

    if (search) {
        // Global search mode
        const users = await User.find({
            $or: [
                { fullName: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ],
            _id: { $ne: loggedInUserId },
        }).select("-password -REFRESH_TOKEN").limit(20);

        const currentUser = await User.findById(loggedInUserId);
        const usersWithPrivacy = users.map((u) => {
            const uObj = u.toObject();
            const isMutual = currentUser.contacts.includes(u._id) && uObj.contacts.some(id => id.toString() === loggedInUserId.toString());
            if (!isMutual) uObj.status = "";
            return uObj;
        });

        return res.status(200).json(new ApiResponse(200, usersWithPrivacy, "Users found"));
    }

    // Populate only the users in the contacts list
    const currentUser = await User.findById(loggedInUserId)
        .populate("contacts", "-password -REFRESH_TOKEN");

    const contactsWithPrivacy = currentUser.contacts.map((contact) => {
        const contactObj = contact.toObject();
        const isMutual = contactObj.contacts.some(id => id.toString() === loggedInUserId.toString());
        if (!isMutual) {
            contactObj.status = ""; // Hide status from non-mutual contacts
        }
        return contactObj;
    });

    const myGroups = await Group.find({ members: loggedInUserId });
    const formattedGroups = myGroups.map(group => ({
        _id: group._id,
        fullName: group.name,
        username: group.members.length + " members",
        avtar: group.avtar,
        isGroup: true,
        status: ""
    }));

    const unifiedList = [...contactsWithPrivacy, ...formattedGroups];

    res.status(200).json(
        new ApiResponse(200, unifiedList, "Contacts and Groups fetched successfully")
    )
})

const addContact = asyncHandler(async (req, res) => {
    const { query } = req.body; // search by username or email
    if (!query) throw new ApiError(400, "Search query is required");

    const loggedInUserId = req.user._id;

    // Find user by username or email (exclude self)
    const userToAdd = await User.findOne({
        $or: [{ username: query }, { email: query }],
        _id: { $ne: loggedInUserId },
    }).select("-password -REFRESH_TOKEN");

    if (!userToAdd) throw new ApiError(404, "User not found");

    // Check if already in contacts
    const currentUser = await User.findById(loggedInUserId);
    if (currentUser.contacts.includes(userToAdd._id)) {
        throw new ApiError(400, "User is already in your contacts");
    }

    currentUser.contacts.push(userToAdd._id);
    await currentUser.save({ validateBeforeSave: false });

    res.status(200).json(
        new ApiResponse(200, userToAdd, "Contact added successfully")
    );
});

const googleAuth = asyncHandler(async (req, res) => {
    const { credential } = req.body;
    if (!credential) throw new ApiError(400, "Google credential is required");

    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
        // Create user if not exists
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const baseUsername = email.split('@')[0];
        const randomSuffix = Math.floor(Math.random() * 10000);

        user = await User.create({
            username: `${baseUsername}${randomSuffix}`,
            fullName: name,
            email: email,
            password: randomPassword,
            avtar: picture,
            isVerified: true
        });
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndrefreshToken(user._id);
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    };

    res.cookie("ACCESS_TOKEN", accessToken, options);
    res.cookie("REFRESH_TOKEN", refreshToken, options);

    const loggedInUser = await User.findById(user._id).select("-password -REFRESH_TOKEN");

    return res.status(200).json(
        new ApiResponse(200, { accessToken, refreshToken, user: loggedInUser }, "user logged in via google successfully")
    );
});

const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -REFRESH_TOKEN");
    if (!user) throw new ApiError(404, "User not found");
    return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

const updateProfile = asyncHandler(async (req, res) => {
    const { fullName, status, avatar } = req.body;
    const userId = req.user._id;

    const updateData = {};

    if (fullName !== undefined) {
        if (fullName.trim().length === 0) throw new ApiError(400, "Full name cannot be empty");
        updateData.fullName = fullName.trim();
    }

    if (status !== undefined) {
        if (status.length > 150) throw new ApiError(400, "Status too long (max 150 chars)");
        updateData.status = status;
    }

    if (avatar) {
        // avatar is a base64 data URI from the frontend
        try {
            const uploadResult = await cloudinary.uploader.upload(avatar, {
                folder: "chat_avatars",
                width: 400,
                height: 400,
                crop: "fill",
            });
            updateData.avtar = uploadResult.secure_url;
        } catch (err) {
            throw new ApiError(500, "Failed to upload avatar: " + err.message);
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
    ).select("-password -REFRESH_TOKEN");

    return res.status(200).json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        throw new ApiError(400, "Email and verification code are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
        return res.status(200).json(new ApiResponse(200, {}, "Email is already verified"));
    }

    if (user.verificationCode !== code) {
        throw new ApiError(400, "Invalid verification code");
    }

    if (user.verificationCodeExpires < Date.now()) {
        throw new ApiError(400, "Verification code has expired");
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, {}, "Email verified successfully")
    );
});

export { register, login, logout, getUsersForSidebar, googleAuth, addContact, getMe, updateProfile, verifyEmail }
