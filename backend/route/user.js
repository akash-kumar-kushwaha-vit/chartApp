import { Router } from "express";
import { login, register, logout, getUsersForSidebar, googleAuth, addContact, getMe, updateProfile, verifyEmail, blockUser, unblockUser, muteUser } from "../controller/user.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const userRouter = Router();

userRouter.route('/register').post(register)
userRouter.route('/login').post(login)
userRouter.route('/verify-email').post(verifyEmail)
userRouter.route('/logout').post(verifyJWT, logout)
userRouter.route('/users').get(verifyJWT, getUsersForSidebar)
userRouter.route('/add-contact').post(verifyJWT, addContact)
userRouter.route('/google-auth').post(googleAuth)
userRouter.route('/me').get(verifyJWT, getMe)
userRouter.route('/profile/update').put(verifyJWT, updateProfile)
userRouter.route('/block/:userId').post(verifyJWT, blockUser)
userRouter.route('/unblock/:userId').post(verifyJWT, unblockUser)
userRouter.route('/mute/:userId').post(verifyJWT, muteUser)

export default userRouter