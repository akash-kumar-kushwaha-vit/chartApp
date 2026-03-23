import { Router } from "express";
import { createGroup, updateGroupInfo, addMembers, removeMember, getGroupDetails } from "../controller/group.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import multer from "multer";

const storage = multer.diskStorage({});
const upload = multer({ storage });

const groupRouter = Router();

groupRouter.route('/create').post(verifyJWT, upload.single('avtar'), createGroup);
groupRouter.route('/:groupId').get(verifyJWT, getGroupDetails);
groupRouter.route('/:groupId/update').put(verifyJWT, upload.single('avtar'), updateGroupInfo);
groupRouter.route('/:groupId/add').post(verifyJWT, addMembers);
groupRouter.route('/:groupId/remove/:userId').delete(verifyJWT, removeMember);

export default groupRouter;
