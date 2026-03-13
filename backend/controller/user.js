
import { User } from "../model/user.model.js"
import { ApiError } from "../utility/apiError.js";
import { asyncHandler } from "../utility/asyncHandler.js"
import { ApiResponse } from "../utility/apiResponse.js";
import { OAuth2Client } from "google-auth-library";

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

    const user = await User.create({
        username,
        fullName,
        email,
        password,

    })

    const usercreated = await User.findById(user._id).select(
        "-password"
    )
    if (!usercreated) throw new ApiError(500, "registrion failed! something went wrong")

    return res.status(201).json(
        new ApiResponse(200, usercreated, "user created succsessfully")
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

    const isPasswordValid = await existUser.isPasswordCorrect(password)
    if (!isPasswordValid) throw new ApiError(401, "Invalid password")

    const { accessToken, refreshToken } = await generateAccessTokenAndrefreshToken(existUser._id);
    const option = {
        httpOnly: true,
        secure: true
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
        secure: true
    }

    return res
        .status(200)
        .clearCookie("ACCESS_TOKEN", options)
        .clearCookie("REFRESH_TOKEN", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const getUsersForSidebar = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user._id;

    // find all users except current logged in user
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password -REFRESH_TOKEN");

    res.status(200).json(
        new ApiResponse(200, filteredUsers, "Users fetched successfully")
    )
})

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
            avtar: picture
        });
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndrefreshToken(user._id);
    const options = {
        httpOnly: true,
        secure: true
    };

    res.cookie("ACCESS_TOKEN", accessToken, options);
    res.cookie("REFRESH_TOKEN", refreshToken, options);

    const loggedInUser = await User.findById(user._id).select("-password -REFRESH_TOKEN");

    return res.status(200).json(
        new ApiResponse(200, { accessToken, refreshToken, user: loggedInUser }, "user logged in via google successfully")
    );
});

export { register, login, logout, getUsersForSidebar, googleAuth }
