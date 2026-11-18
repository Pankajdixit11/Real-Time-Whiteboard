import React, { useState, useCallback, useEffect } from 'react';
import { useSocket } from './useSocket';
import Whiteboard from './Whiteboard';
import Toolbar from './Toolbar';
import Header from './Header';
import CursorOverlay from './CursorOverlay';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function App() {
  // Drawing tool states: 'pen' | 'eraser' | 'circle' | 'square' | 'rect' | 'text'
  const [activeTool, setActiveTool] = useState('pen');
  const [color, setColor] = useState('#1e293b');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [shapeFill, setShapeFill] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [boardTitle, setBoardTitle] = useState('⚡ Team Brainstorm');
  const [exportTrigger, setExportTrigger] = useState(0);

  // Dark Mode state with localStorage persistence
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('whiteboard_dark_mode') === 'true';
  });

  // Modal states
  const [showClearModal, setShowClearModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomInput, setNewRoomInput] = useState('');

  // Real-time socket hook
  const {
    socket,
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
    emitBgChange,
    changeRoom
  } = useSocket('team-meeting');

  // Handle Theme Toggle
  const handleToggleDarkMode = (isDark) => {
    setDarkMode(isDark);
    localStorage.setItem('whiteboard_dark_mode', String(isDark));

    // Smart contrast adjustments
    if (isDark) {
      if (color === '#1e293b') setColor('#f8fafc');
      if (bgColor === '#f8fafc' || bgColor === '#ffffff') emitBgChange('#0f172a');
    } else {
      if (color === '#f8fafc' || color === '#ffffff') setColor('#1e293b');
      if (bgColor === '#0f172a' || bgColor === '#18181b') emitBgChange('#f8fafc');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Clean entire whiteboard page
  const handleConfirmClear = useCallback(() => {
    emitClear();
    if (socket) {
      socket.emit('clear_canvas', { roomId });
    }
    window.dispatchEvent(new CustomEvent('whiteboard_clear'));
    setShowClearModal(false);
  }, [emitClear, socket, roomId]);

  // Global Delete hotkey (when not typing in an input/textarea)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && (e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        setShowClearModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle room change
  const handleJoinNewRoom = (e) => {
    e.preventDefault();
    if (!newRoomInput.trim()) return;
    const formatted = newRoomInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    changeRoom(formatted);
    setShowRoomModal(false);
    setNewRoomInput('');
  };

  const handleGenerateRandomRoom = () => {
    const randomSlug = 'room-' + Math.random().toString(36).substring(2, 8);
    changeRoom(randomSlug);
    setShowRoomModal(false);
  };

  return (
    <main className={`relative w-screen h-screen overflow-hidden font-sans select-none transition-colors duration-200 ${
      darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Top Header with Clean Page Button */}
      <Header
        roomId={roomId}
        myUser={myUser}
        users={users}
        connected={connected}
        gridEnabled={gridEnabled}
        setGridEnabled={setGridEnabled}
        onExportPNG={() => setExportTrigger((c) => c + 1)}
        onSwitchRoom={() => setShowRoomModal(true)}
        onClearCanvas={() => setShowClearModal(true)}
        boardTitle={boardTitle}
        setBoardTitle={setBoardTitle}
        darkMode={darkMode}
        setDarkMode={handleToggleDarkMode}
        bgColor={bgColor}
        onSelectBgColor={emitBgChange}
      />

      {/* Fixed Left Toolbar */}
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        color={color}
        setColor={setColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        shapeFill={shapeFill}
        setShapeFill={setShapeFill}
        onClearCanvas={() => setShowClearModal(true)}
        darkMode={darkMode}
      />

      {/* Real-Time Live Cursor Overlay */}
      <CursorOverlay cursors={cursors} />

      {/* Main Collaborative Canvas Engine */}
      <Whiteboard
        activeTool={activeTool}
        color={color}
        strokeWidth={strokeWidth}
        shapeFill={shapeFill}
        gridEnabled={gridEnabled}
        bgColor={bgColor}
        socket={socket}
        emitDraw={emitDraw}
        emitCursor={emitCursor}
        initialStrokes={initialStrokes}
        exportTrigger={exportTrigger}
      />

      {/* Clean Whole Page / Delete Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl border flex flex-col items-center text-center ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center mb-3.5 shadow-sm">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Clean Whole Page?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-6 leading-relaxed">
              This will completely delete all drawings, shapes, and text on this board for everyone in room <span className="font-semibold text-slate-700 dark:text-slate-200">#{roomId}</span>.
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className={`flex-1 py-2.5 px-4 rounded-xl border font-semibold text-sm transition-colors cursor-pointer ${
                  darkMode 
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 shadow-md shadow-red-500/30 transition-all cursor-pointer"
              >
                Yes, Clean Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <h3 className="text-lg font-bold">Collaborative Rooms</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Enter a room name to join an existing session or start a private session.
            </p>

            <form onSubmit={handleJoinNewRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Room Name / ID
                </label>
                <div className={`flex rounded-xl border px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 ${
                  darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-slate-400 font-mono select-none">#</span>
                  <input
                    type="text"
                    value={newRoomInput}
                    onChange={(e) => setNewRoomInput(e.target.value)}
                    placeholder="e.g. design-sprint, sprint-planning"
                    className={`ml-2 w-full outline-none text-sm placeholder-slate-400 bg-transparent ${
                      darkMode ? 'text-white' : 'text-slate-800'
                    }`}
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleGenerateRandomRoom}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-600 hover:underline"
                >
                  ⚡ Generate Random Room
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRoomModal(false)}
                    className={`py-2 px-3.5 rounded-xl border font-medium text-xs transition-colors ${
                      darkMode 
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newRoomInput.trim()}
                    className="py-2 px-4 rounded-xl bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-500/20 transition-colors"
                  >
                    Join Room
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
