import express from 'express'
import cookieparser from 'cookie-parser'
import cors from 'cors'

import { app } from "./socket/socket.js"

const corsOptions = {
    origin: "https://helloapp-jlhs.onrender.com", // ← no trailing slash
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests for all routes
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use(cookieparser())


// import routers
import userRouter from './route/user.js';
import messageRouter from './route/message.js';
import groupRouter from './route/group.route.js';

app.use("/api/auth", userRouter); // I am renaming to /api/auth as standard
app.use("/api/messages", messageRouter);
app.use("/api/groups", groupRouter);

// Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    });
});

export { app };