import { Server } from "socket.io";

let ioInstance;

export function initSocket(httpServer) {
  // Configure Socket.io for both development and production
  const NODE_ENV = process.env.NODE_ENV || "development";
  
  const corsConfig =
    NODE_ENV === "production"
      ? {
          origin: true, // Allow same origin in production (single server deployment)
          methods: ["GET", "POST"],
          credentials: true,
        }
      : {
          origin: "http://localhost:5173",
          methods: ["GET", "POST"],
        };

  ioInstance = new Server(httpServer, {
    cors: corsConfig,
  });

  ioInstance.on("connection", (socket) => {
    socket.on("joinTeam", ({ teamId }) => {
      if (teamId) {
        socket.join(`team:${teamId}`);
      }
    });
  });

  return ioInstance;
}

export function emitToTeam(teamId, event, payload) {
  if (!ioInstance || !teamId) return;
  ioInstance.to(`team:${teamId}`).emit(event, payload);
}
