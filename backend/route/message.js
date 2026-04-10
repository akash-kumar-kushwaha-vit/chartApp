import { Router } from "express";
import { getMessages, sendMessage, editMessage, deleteMessage, reactToMessage, markMessagesAsRead, getUnreadCounts } from "../controller/message.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import multer from "multer";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./public/temp";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

export const upload = multer({ storage: storage })

const messageRouter = Router();

messageRouter.route('/unread-counts').get(verifyJWT, getUnreadCounts)
messageRouter.route('/:id').get(verifyJWT, getMessages)
messageRouter.route('/send/:id').post(verifyJWT, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'file', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), sendMessage)
messageRouter.route('/edit/:id').put(verifyJWT, editMessage)
messageRouter.route('/delete/:id').delete(verifyJWT, deleteMessage)
messageRouter.route('/react/:id').post(verifyJWT, reactToMessage)
messageRouter.route('/mark-read/:id').post(verifyJWT, markMessagesAsRead)

export default messageRouter;

