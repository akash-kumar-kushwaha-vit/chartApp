import { Router } from "express";
import { getMessages, sendMessage } from "../controller/message.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save temporarily in current directory or public/temp
    // ensure we have a public/temp directory
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

export const upload = multer({ storage: storage })

const messageRouter = Router();

messageRouter.route('/:id').get(verifyJWT, getMessages)
// use multer to intercept 'image' field before reaching the sendMessage controller
messageRouter.route('/send/:id').post(verifyJWT, upload.single('image'), sendMessage)

export default messageRouter;
