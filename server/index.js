const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

const USER_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#6366f1"
];

// Room storage: roomId -> { strokes: [], users: Map(), bgColor: string }
const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      strokes: [],
      users: new Map(),
      bgColor: "#f8fafc"
    });
  }
  return rooms.get(roomId);
}

function getRandomColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    roomsCount: rooms.size,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/rooms/:roomId", (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) {
    return res.json({ exists: false, activeUsers: 0, strokeCount: 0 });
  }
  res.json({
    exists: true,
    activeUsers: room.users.size,
    strokeCount: room.strokes.length,
    bgColor: room.bgColor || "#f8fafc"
  });
});

io.on("connection", (socket) => {
  let currentRoomId = null;
  let currentUser = null;

  console.log("[Socket Connected] ID: " + socket.id);

  socket.on("join_room", ({ roomId = "general", userName }) => {
    if (currentRoomId && currentRoomId !== roomId) {
      socket.leave(currentRoomId);
      const prevRoom = rooms.get(currentRoomId);
      if (prevRoom) {
        prevRoom.users.delete(socket.id);
        io.to(currentRoomId).emit("user_left", {
          userId: socket.id,
          users: Array.from(prevRoom.users.values())
        });
      }
    }

    currentRoomId = roomId;
    socket.join(roomId);

    const room = getOrCreateRoom(roomId);
    
    const displayName = userName && userName.trim() 
      ? userName.trim() 
      : "User " + socket.id.slice(0, 4).toUpperCase();

    currentUser = {
      id: socket.id,
      name: displayName,
      color: getRandomColor()
    };

    room.users.set(socket.id, currentUser);

    console.log("[User Joined] " + currentUser.name + " (" + socket.id + ") joined room: " + roomId + ". Total in room: " + room.users.size);

    socket.emit("init_canvas", {
      strokes: room.strokes,
      users: Array.from(room.users.values()),
      myUser: currentUser,
      bgColor: room.bgColor || "#f8fafc"
    });

    socket.to(roomId).emit("user_joined", {
      user: currentUser,
      users: Array.from(room.users.values())
    });
  });

  // Real-Time Drawing Stroke / Shape / Text Broadcast
  socket.on("draw", ({ roomId, stroke }) => {
    const targetRoomId = roomId || currentRoomId;
    if (!targetRoomId) return;

    const room = getOrCreateRoom(targetRoomId);

    if (room.strokes.length >= 25000) {
      room.strokes.splice(0, 5000);
    }
    room.strokes.push(stroke);

    socket.to(targetRoomId).emit("receive_draw", stroke);
  });

  // Background Color Change Broadcast
  socket.on("bg_change", ({ roomId, bgColor }) => {
    const targetRoomId = roomId || currentRoomId;
    if (!targetRoomId || !bgColor) return;

    const room = getOrCreateRoom(targetRoomId);
    room.bgColor = bgColor;

    console.log("[Background Change] Room " + targetRoomId + " changed bg to " + bgColor);
    socket.to(targetRoomId).emit("receive_bg_change", { bgColor });
  });

  // Undo Broadcast
  socket.on("undo", ({ roomId, strokeId }) => {
    const targetRoomId = roomId || currentRoomId;
    if (!targetRoomId) return;

    const room = getOrCreateRoom(targetRoomId);

    if (strokeId) {
      room.strokes = room.strokes.filter((s) => s.strokeId !== strokeId);
    } else if (room.strokes.length > 0) {
      room.strokes.pop();
    }

    socket.to(targetRoomId).emit("receive_undo", { strokeId });
  });

  // Clear Canvas Broadcast
  socket.on("clear_canvas", ({ roomId }) => {
    const targetRoomId = roomId || currentRoomId;
    if (!targetRoomId) return;

    const room = getOrCreateRoom(targetRoomId);
    room.strokes = [];

    console.log("[Clear Canvas] Board cleared in room: " + targetRoomId);
    io.to(targetRoomId).emit("receive_clear_canvas");
  });

  // Cursor Synchronization
  socket.on("cursor_move", ({ roomId, x, y }) => {
    const targetRoomId = roomId || currentRoomId;
    if (!targetRoomId || !currentUser) return;

    socket.to(targetRoomId).emit("cursor_update", {
      userId: socket.id,
      user: currentUser,
      x,
      y
    });
  });

  socket.on("disconnect", () => {
    console.log("[Socket Disconnected] ID: " + socket.id);
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.users.delete(socket.id);
        
        socket.to(currentRoomId).emit("user_left", {
          userId: socket.id,
          users: Array.from(room.users.values())
        });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log("🚀 Whiteboard Server listening on port " + PORT);
});
