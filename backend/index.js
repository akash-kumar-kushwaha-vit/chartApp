import 'dotenv/config';
import "./app.js";
import { server } from "./socket/socket.js";
import connectDB from './db/db.js';

connectDB().then(() => {
    server.listen(process.env.PORT || 4000, () => {
        console.log("server run on PORT " + (process.env.PORT || 4000))
    })
}).catch(() => {
    console.log("error in connection mongodb")
})
