import { Server } from "socket.io";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Change this in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ Client Connected: ${socket.id}`);

    /**
     * Customer joins order room
     * socket.emit("join-order", { orderId: "ORD500" })
     */
    socket.on("join-order", ({ orderId }) => {
      socket.join(`order_${orderId}`);

      console.log(
        `📦 Socket ${socket.id} joined room order_${orderId}`
      );
    });

    /**
     * Customer leaves room
     */
    socket.on("leave-order", ({ orderId }) => {
      socket.leave(`order_${orderId}`);

      console.log(
        `🚪 Socket ${socket.id} left room order_${orderId}`
      );
    });

    /**
     * Client disconnected
     */
    socket.on("disconnect", () => {
      console.log(`❌ Client Disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized.");
  }

  return io;
};