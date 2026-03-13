import mongoose from "mongoose";

const connectDB = async () => {
    try {
        console.log(process.env.MONGO_URI)
        await mongoose.connect(`${process.env.MONGO_URI}`);
        console.log("MongoDB connected successfully ✅");
    } catch (error) {
        console.error("MongoDB connection failed ❌");
        console.error(error.message);
        process.exit(1);
    }
};

export default connectDB;