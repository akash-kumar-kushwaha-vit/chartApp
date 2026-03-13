import { Router } from "express";
import { login, register, logout, getUsersForSidebar, googleAuth } from "../controller/user.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const userRouter = Router();

userRouter.route('/register').post(register)
userRouter.route('/login').post(login)
userRouter.route('/logout').post(verifyJWT, logout)
userRouter.route('/users').get(verifyJWT, getUsersForSidebar)
userRouter.route('/google-auth').post(googleAuth)

export default userRouter