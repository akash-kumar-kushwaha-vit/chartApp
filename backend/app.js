import express from 'express'
import cookieparser from 'cookie-parser'
import cors from 'cors'

import { app } from "./socket/socket.js"

app.use(cors({ origin: process.env.ORIGIN_URL, credentials: true }))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use(cookieparser())


// import routers
import userRouter from './route/user.js';
import messageRouter from './route/message.js';

app.use("/api/auth", userRouter); // I am renaming to /api/auth as standard
app.use("/api/messages", messageRouter);

export { app };