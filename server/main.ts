import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import mongoose from "mongoose";
import config from "./config/config";
import logger from "./middleware/logger";
import { Message } from "./models/message";
import { addUser, findUser, removeUser } from "./middleware/cache";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  path: "/ws/chat",
});
mongoose
  .connect(config.db || "")
  .then(() => logger.info("db connected successfully"))
  .catch((error) =>
    logger.error("error happened while connecting db " + error.message),
  );

io.on("connection", (socket) => {
  console.log("New socket connected", socket.id);

  socket.on("init", async ({ sender, receiver }) => {
    await addUser(sender, socket.id);

    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ date: 1 });

    socket.emit("previousMessages", messages);
    // Send to receiver if online
    const receiverSocketId = await findUser(receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("online", true);
      socket.emit("online", true);
    }
  });
  socket.on("message", async (msg) => {
    const { sender, receiver, text } = msg;

    const newMsg = await Message.create({
      sender,
      receiver,
      text,
      read: false,
      date: new Date(),
    });

    // Send to sender
    socket.emit("message", newMsg);

    // Send to receiver if online
    const receiverSocketId = await findUser(receiver);
    if (receiverSocketId) io.to(receiverSocketId).emit("message", newMsg);
  });

  // ✅ New: mark messages as read
  socket.on("markAsRead", async ({ sender, receiver }) => {
    await Message.updateMany(
      { sender, receiver, read: false },
      { $set: { read: true } },
    );

    const updatedMessages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ date: 1 });

    // Notify receiver (user who marked as read)
    socket.emit("messagesRead", updatedMessages);

    // Also notify sender (if online)
    const senderSocketId = await findUser(sender);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", updatedMessages);
    }
  });

  socket.on("disconnect", async () => {
    // Find username from cache and remove
    const username = Array.from(io.sockets.sockets.entries()).find(
      ([, s]) => s.id === socket.id,
    )?.[0];

    if (username) {
      await removeUser(username);
      console.log("Removed user from cache:", username);
    }
  });
});

server.listen(3005, () => console.log("http://localhost:3005"));
