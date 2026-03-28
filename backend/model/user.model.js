import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt, { hash } from "bcrypt"

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,

    },
    password: {
        type: String,
        required: true,
    },
    avtar: {
        type: String,//cloudnary 
    },
    status: {
        type: String,
        default: "",
        maxlength: 150,
    },
    chatWallpaper: {
        type: String,
        default: "",
    },
    publicKey: {
        type: String,
        default: "",
    },
    contacts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    videos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
    }],
    history: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
    }],
    REFRESH_TOKEN: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationCode: {
        type: String,
    },
    verificationCodeExpires: {
        type: Date,
    }

}, { timestamps: true })


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return;
    this.password = await hash(this.password, 10)

});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        user: this.user,
        fullName: this.fullName,
        password: this.password,
    },
        process.env.ACCESS_TOKEN,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
    },
        process.env.REFRESS_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESS_TOKEN_EXPIRY
        }
    )
}



export const User = mongoose.model("User", userSchema);