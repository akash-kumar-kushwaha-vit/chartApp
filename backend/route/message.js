import { Router } from "express";
import { getMessages, sendMessage, editMessage, deleteMessage, reactToMessage, markMessagesAsRead, getUnreadCounts } from "../controller/message.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

export const upload = multer({ storage: storage })

const messageRouter = Router();

messageRouter.route('/:id').get(verifyJWT, getMessages)
messageRouter.route('/send/:id').post(verifyJWT, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'file', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), sendMessage)
messageRouter.route('/edit/:id').put(verifyJWT, editMessage)
messageRouter.route('/delete/:id').delete(verifyJWT, deleteMessage)
messageRouter.route('/react/:id').post(verifyJWT, reactToMessage)
messageRouter.route('/mark-read/:id').post(verifyJWT, markMessagesAsRead)
messageRouter.route('/unread-counts').get(verifyJWT, getUnreadCounts)

export default messageRouter;

