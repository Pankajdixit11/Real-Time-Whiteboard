# ⚡ LiveBoard — Collaborative Real-Time Whiteboard

A production-grade, collaborative real-time whiteboard web application built with **React (Vite)**, **HTML5 Canvas API**, **Tailwind CSS**, and **Node.js / Socket.io**. Multiple users can draw simultaneously on a shared canvas with sub-50ms synchronization, live remote cursors, geometric shapes, an interactive text typing tool, custom board backgrounds, Dark/Light modes, and multi-tenant room scoping.

Inspired by modern whiteboard tools like **Miro** and **Excalidraw**.

---

## 🚀 Quick Start Guide

You can run both the frontend and backend concurrently from the root directory with a single command!

### 1. Install Dependencies
From the `Real Time Whiteboard` root folder:
```bash
# Installs dependencies for both server and client
npm run install:all
```

*(Or install individually)*:
```bash
# In server/
cd server && npm install

# In client/
cd ../client && npm install
```

### 2. Start Development Servers
From the `Real Time Whiteboard` root folder:
```bash
npm run dev
```
This concurrently starts:
- 📡 **Backend (Socket.io & Express)** on `http://localhost:5000`
- 🎨 **Frontend (Vite + React)** on `http://localhost:5173`

Open `http://localhost:5173` in your browser!

---

## 🎨 Features & Architecture

### 1. Geometric Shapes (Circle, Square, Rectangle)
- **Live 60fps Drag Preview**: A transparent preview layer renders shapes dynamically as you drag before committing to the main canvas.
- ⭕ **Circle Tool**: Drag to draw smooth circles.
- ⏹️ **Square Tool**: Drag to draw 1:1 equilateral squares.
- ▭ **Rectangle Tool**: Drag to draw custom rectangular frames.
- 🪣 **Shape Fill Toggle**: Switch between clean wireframe outlines and subtle transparent color fills.

### 2. Interactive Text Tool (On Canvas & Inside Shapes)
- 🔤 **Click-to-Type Text Engine**: Click anywhere on the whiteboard or inside any drawn shape (circle, square, rectangle) to place an inline text editor.
- **Multiline Support**: Type notes, titles, or paragraphs with dynamic font sizing.
- **Real-Time Broadcast**: Commits cleanly on Enter or blur, synchronizing font and coordinates across all peers.

### 3. Board Background Customization
- 🎨 **Instant Board Palette**: Switch canvas background across:
  - **Pure White** (`#ffffff`)
  - **Slate Paper** (`#f8fafc`)
  - **Warm Cream** (`#fefce8`)
  - **Blueprint Navy** (`#0f172a`)
  - **Chalkboard Green** (`#143e32`)
  - **Deep Charcoal** (`#18181b`)
  - **Custom Color Picker**: Choose any custom hex background.
- **Room-Wide Sync**: When a collaborator changes the board background, it automatically syncs across everyone in the room and persists for new joiners.
- **Dynamic Dot Grid**: Automatically adjusts dot contrast (dark dots on light boards, white dots on dark boards).

### 4. Dark Mode & Light Mode Theme System
- ☀️ / 🌙 **1-Click Theme Switcher**: Located right in the top header.
- **Glassmorphism Chrome**: Dynamic dark/light glass panels for the toolbar, header, modals, and cursor tags.
- **Smart Pen Inversion**: Automatically adjusts default pen color to maintain sharp contrast when switching themes.

### 5. Canvas Drawing & Eraser (HTML5 Canvas API)
- **High-DPI / Retina Crispness**: Renders at native device pixel ratio for smooth, high-fidelity lines.
- **Mouse & Touch Support**: Full support for stylus, mouse, and multi-touch mobile/tablet drawing with `touch-action: none` to eliminate page scroll jitter.
- **Single-Click Stippling**: Click once anywhere to draw single dots/points.
- **Window Resize Persistence**: Automatically replays drawing history on viewport resize, preventing any loss of artwork.

### 6. Sleek Floating Toolbar (Miro/Excalidraw Design)
- ✏️ **Pen Tool**: Freehand stroke drawing with rounded caps and joins.
- 🧹 **Eraser Tool**: Removes drawings using HTML5 Canvas `destination-out` composite operation.
- 🎨 **Color Palette**: 6 curated presets plus an HTML5 custom color picker input.
- 📏 **Stroke Width**: 4 quick presets (2px, 5px, 10px, 20px) plus an interactive slider (1px to 40px).
- 🗑️ **Clear Canvas**: Clears the board for all connected collaborators with a confirmation safety modal.
- 💾 **Export as PNG**: Instant client-side PNG image export that captures the chosen background color.
- 🔲 **Grid Toggle**: Switch between an Excalidraw-style subtle dot grid and a clean plain canvas.

### 7. Real-Time Collaboration & Synchronization
- **Sub-50ms Line Streaming**: Real-time vector segments and shapes are broadcasted as you draw, so other users see strokes forming in real time.
- **Live Remote Cursors**:
  - Each peer is assigned a vibrant avatar color.
  - Remote cursor pointer with attached name badge tracks peer movements in real time.
  - Inactive cursors automatically fade after 5 seconds of inactivity.
- **State Hydration / Replay**: When a new collaborator enters the room, the backend transmits the room's drawing history and current background color (`init_canvas`) so they immediately see all previous artwork.

### 8. 🌐 Product Thinking: Multi-Tenancy & Room URLs
- **URL-based Room Scoping**:
  - Shareable link format: `http://localhost:5173/?room=room-123` or `http://localhost:5173/?room=team-sprint`.
  - Only participants who have the specific room link can view and participate in that whiteboard session.
- **Invite & Share**:
  - Click **"Invite"** in the top bar to copy the shareable room link to your clipboard.
  - Click **"+"** in the header to create or switch rooms on the fly.
  - One-click random room generator (`⚡ Generate Random Room`).

---

## 📡 Socket.io Event Protocol

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join_room` | Client ➔ Server | `{ roomId, userName }` | Client joins room, registers name, and requests state |
| `init_canvas` | Server ➔ Client | `{ strokes, users, myUser, bgColor }` | Sends room history, participant roster, and background color |
| `user_joined` | Server ➔ Broadcast | `{ user, users }` | Notifies other users in room of a new arrival |
| `user_left` | Server ➔ Broadcast | `{ userId, users }` | Notifies other users when a user leaves/disconnects |
| `draw` | Client ➔ Server | `{ roomId, stroke }` | Emits a stroke, shape, or text item |
| `receive_draw` | Server ➔ Broadcast | `stroke` | Renders incoming drawing item on peer canvases |
| `bg_change` | Client ➔ Server | `{ roomId, bgColor }` | Broadcasts board background color update |
| `receive_bg_change` | Server ➔ Broadcast | `{ bgColor }` | Updates board background color across all room peers |
| `cursor_move` | Client ➔ Server | `{ roomId, x, y }` | Emits throttled mouse/touch coordinates |
| `cursor_update`| Server ➔ Broadcast | `{ userId, user, x, y }` | Updates live cursor overlay position on peers |
| `clear_canvas` | Client ➔ Server | `{ roomId }` | Requests board wipe for the room |
| `receive_clear_canvas` | Server ➔ Broadcast | None | Wipes local canvas and stroke history across all room peers |

---

## 📂 Project Structure

```
Real Time Whiteboard/
├── package.json              # Monorepo root scripts (concurrently dev & install)
├── README.md                 # Project documentation & run guide
│
├── server/                   # Backend Node.js / Express / Socket.io
│   ├── package.json
│   ├── index.js              # Express app, Socket.io room logic, in-memory store
│   └── ...
│
└── client/                   # Frontend Vite + React + Tailwind CSS
    ├── package.json
    ├── vite.config.js        # Vite + Tailwind v4 plugin config
    ├── index.html
    └── src/
        ├── main.jsx          # Entry point
        ├── index.css         # Tailwind styles & dot grid canvas CSS
        ├── App.jsx           # Root layout, theme states & modals
        ├── useSocket.js      # Socket.io connection hook & event bus
        ├── Whiteboard.jsx    # Dual-canvas engine, shapes, text tool, resize replay
        ├── Toolbar.jsx       # Floating toolbar: pen, eraser, shapes, text, colors
        ├── Header.jsx        # Room badge, dark mode, background picker, avatars
        └── CursorOverlay.jsx # Real-time peer cursors with colored badges
```

####  License
```markdown
## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
