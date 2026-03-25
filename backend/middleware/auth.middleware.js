import jwt from "jsonwebtoken";
import { User } from "../model/user.model.js";
import { asyncHandler } from "../utility/asyncHandler.js";
import { ApiResponse } from "../utility/apiResponse.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.ACCESS_TOKEN || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json(new ApiResponse(401, null, "Unauthorized request"));
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN);

        const user = await User.findById(decodedToken?._id).select("-password -REFRESH_TOKEN");

        if (!user) {
            return res.status(401).json(new ApiResponse(401, null, "Invalid Access Token"));
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json(new ApiResponse(401, null, error?.message || "Invalid access token"));
    }
});
