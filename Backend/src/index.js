import express from "express";
import dotenv from "dotenv";
import notesRoutes from "./routes/notesRoutes.js";
import { connectDB } from "./config/db.js";
import ratelimiter from "./middleware/ratelimiter.js";
import cors from 'cors';
import authRoutes from "./routes/authRoutes.js";
import cookieParser from 'cookie-parser';
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import {app,server} from "./config/socket.js";

import path from 'path';
import emotionRoutes from "./routes/emotionRoutes.js";


dotenv.config();
const PORT = process.env.PORT || 5001;
// const __dirname = path.resolve();

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser())
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true
}))

app.use(ratelimiter);

app.use('/api/notes',notesRoutes);
app.use('/api/auth',authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/message',messageRoutes);
app.use('/api/emotion', emotionRoutes);
// if (process.env.NODE_ENV === "production"){
//     app.use(express.static(path.join(__dirname, "../Frontend/dist")));
//     app.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "../Frontend/dist/index.html"));
// });

// }
connectDB().then(()=>{
    server.listen(PORT,()=>{
    console.log(`Server activated on port ${PORT}`);
})
})
