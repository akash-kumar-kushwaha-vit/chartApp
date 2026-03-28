import { Router } from "express";
import { login, register, logout, getUsersForSidebar, googleAuth, addContact, getMe, updateProfile, verifyEmail } from "../controller/user.js";
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

export default userRouter