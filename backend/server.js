import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import callLogRoutes from './routes/callLogRoutes.js';
import initSocket from './socket/socket.js';


dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cors());

app.use(cookieParser());



app.use('/api/users', authRoutes); // Auth (Login/Register)
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/calls', callLogRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
initSocket(server);