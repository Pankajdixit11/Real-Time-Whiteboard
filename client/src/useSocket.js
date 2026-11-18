import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export function useSocket(initialRoomId = "team-meeting") {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("room") || initialRoomId;
  });
  const [myUser, setMyUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [initialStrokes, setInitialStrokes] = useState([]);
  const [bgColor, setBgColor] = useState("#f8fafc");

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected, ID:", socket.id);
      setConnected(true);

      let storedName = localStorage.getItem("whiteboard_username");
      if (!storedName) {
        storedName = "User " + socket.id.slice(0, 4).toUpperCase();
        localStorage.setItem("whiteboard_username", storedName);
      }

      socket.emit("join_room", { roomId, userName: storedName });
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      setConnected(false);
    });

    socket.on("init_canvas", ({ strokes, users, myUser, bgColor: initialBg }) => {
      setInitialStrokes(strokes || []);
      setUsers(users || []);
      setMyUser(myUser);
      if (initialBg) {
        setBgColor(initialBg);
      }
    });

    socket.on("user_joined", ({ users }) => {
      setUsers(users || []);
    });

    socket.on("user_left", ({ userId, users }) => {
      setUsers(users || []);
      setCursors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socket.on("cursor_update", ({ userId, user, x, y }) => {
      setCursors((prev) => ({
        ...prev,
        [userId]: {
          ...user,
          x,
          y,
          lastUpdated: Date.now(),
        },
      }));
    });

    socket.on("receive_bg_change", ({ bgColor: newBg }) => {
      if (newBg) {
        setBgColor(newBg);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCursors((prev) => {
        let changed = false;
        const filtered = {};
        for (const [id, data] of Object.entries(prev)) {
          if (now - data.lastUpdated < 5000) {
            filtered[id] = data;
          } else {
            changed = true;
          }
        }
        return changed ? filtered : prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const emitDraw = useCallback((stroke) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("draw", { roomId, stroke });
    }
  }, [roomId]);

  const emitClear = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("clear_canvas", { roomId });
    }
  }, [roomId]);

  const emitCursor = useCallback((x, y) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("cursor_move", { roomId, x, y });
    }
  }, [roomId]);

  const emitUndo = useCallback((strokeId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("undo", { roomId, strokeId });
    }
  }, [roomId]);

  const emitBgChange = useCallback((newBgColor) => {
    setBgColor(newBgColor);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("bg_change", { roomId, bgColor: newBgColor });
    }
  }, [roomId]);

  const changeRoom = useCallback((newRoomId) => {
    if (!newRoomId || newRoomId === roomId) return;
    const url = new URL(window.location);
    url.searchParams.set("room", newRoomId);
    window.history.pushState({}, "", url);
    setRoomId(newRoomId);
    setCursors({});
    setInitialStrokes([]);
  }, [roomId]);

  return {
    socket: socketRef.current,
    connected,
    roomId,
    myUser,
    users,
    cursors,
    initialStrokes,
    bgColor,
    emitDraw,
    emitClear,
    emitCursor,
    emitUndo,
    emitBgChange,
    changeRoom,
  };
}
