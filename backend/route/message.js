import { Router } from "express";
import { getMessages, sendMessage } from "../controller/message.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

export const upload = multer({ storage: storage })

const messageRouter = Router();

messageRouter.route('/:id').get(verifyJWT, getMessages)
// Accept 'image', 'video', and 'file' file fields
messageRouter.route('/send/:id').post(verifyJWT, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'file', maxCount: 1 }]), sendMessage)

export default messageRouter;

