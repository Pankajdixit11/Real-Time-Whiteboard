import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Share2, 
  Check, 
  Download, 
  Grid, 
  Plus, 
  Wifi, 
  WifiOff, 
  Edit3,
  Sun,
  Moon,
  Palette,
  ChevronDown,
  Trash2
} from 'lucide-react';

const BOARD_BG_PRESETS = [
  { name: 'Pure White', value: '#ffffff', border: '#e2e8f0' },
  { name: 'Slate Paper', value: '#f8fafc', border: '#cbd5e1' },
  { name: 'Warm Cream', value: '#fefce8', border: '#fef08a' },
  { name: 'Blueprint Navy', value: '#0f172a', border: '#334155' },
  { name: 'Chalkboard Green', value: '#143e32', border: '#1f5949' },
  { name: 'Deep Charcoal', value: '#18181b', border: '#3f3f46' }
];

export default function Header({
  roomId,
  myUser,
  users = [],
  connected,
  gridEnabled,
  setGridEnabled,
  onExportPNG,
  onSwitchRoom,
  onClearCanvas,
  boardTitle = 'Team Whiteboard',
  setBoardTitle,
  darkMode = false,
  setDarkMode,
  bgColor = '#f8fafc',
  onSelectBgColor
}) {
  const [copied, setCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showBgDropdown, setShowBgDropdown] = useState(false);
  const bgDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (bgDropdownRef.current && !bgDropdownRef.current.contains(event.target)) {
        setShowBgDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomId)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header className="absolute top-3 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
      {/* Left Section: Board Title & Room Badge */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        <div className={`px-3 py-1.5 rounded-2xl flex items-center gap-2.5 shadow-sm transition-all ${
          darkMode ? 'glass-panel-dark' : 'glass-panel'
        }`}>
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-md select-none">
            W
          </div>

          {isEditingTitle ? (
            <input
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              autoFocus
              className={`font-semibold text-xs tracking-tight bg-transparent border-b border-blue-500 outline-none px-1 py-0.5 ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}
            />
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center gap-1.5 cursor-pointer"
            >
              <h1 className={`font-semibold text-xs tracking-tight ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}>
                {boardTitle}
              </h1>
              <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          <div className={`h-3.5 w-[1px] ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />

          {/* Current Room Indicator */}
          <div className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-lg ${
            darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
          }`}>
            <span className="text-slate-400">#</span>
            <span className="font-medium max-w-[110px] truncate">{roomId}</span>
          </div>

          {/* Share / Copy Room Link Button */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              darkMode 
                ? 'text-slate-200 hover:text-blue-400 bg-slate-800 hover:bg-slate-700' 
                : 'text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50'
            }`}
            title="Copy Shareable Board URL"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Invite</span>
              </>
            )}
          </button>

          {/* Switch / New Room button */}
          <button
            onClick={onSwitchRoom}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Create or Join Another Room"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Section: Clean Page, Background, Dark Mode, Avatars, Grid, Export */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        {/* Clean Whole Page / Delete Button */}
        <button
          onClick={onClearCanvas}
          title="Clean / Delete entire page for everyone"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/60 rounded-2xl border border-red-200/80 dark:border-red-900/60 transition-all shadow-xs hover:shadow-sm cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
          <span>Clean Page</span>
        </button>

        {/* Background Color Dropdown */}
        <div className="relative" ref={bgDropdownRef}>
          <button
            onClick={() => setShowBgDropdown(!showBgDropdown)}
            title="Board Canvas Background Color"
            className={`px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-sm text-xs font-medium transition-all cursor-pointer ${
              darkMode ? 'glass-panel-dark' : 'glass-panel'
            }`}
          >
            <span
              className="w-3.5 h-3.5 rounded-full border shadow-xs"
              style={{ backgroundColor: bgColor, borderColor: darkMode ? '#475569' : '#cbd5e1' }}
            />
            <span className="hidden sm:inline">Canvas</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showBgDropdown && (
            <div className={`absolute right-0 top-11 p-3 rounded-2xl shadow-2xl border z-50 w-56 flex flex-col gap-2.5 animate-in fade-in duration-100 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Board Background
              </div>

              <div className="grid grid-cols-3 gap-2">
                {BOARD_BG_PRESETS.map((bg) => (
                  <button
                    key={bg.value}
                    title={bg.name}
                    onClick={() => {
                      onSelectBgColor(bg.value);
                      setShowBgDropdown(false);
                    }}
                    className={`h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer relative ${
                      bgColor === bg.value 
                        ? 'ring-2 ring-blue-500 scale-105' 
                        : 'hover:scale-102 hover:shadow-xs'
                    }`}
                    style={{ backgroundColor: bg.value, borderColor: bg.border }}
                  >
                    {bgColor === bg.value && (
                      <Check className={`w-3.5 h-3.5 ${
                        bg.value === '#0f172a' || bg.value === '#143e32' || bg.value === '#18181b'
                          ? 'text-white'
                          : 'text-slate-900'
                      }`} />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Canvas Background Picker */}
              <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Custom Color</span>
                <label className="cursor-pointer flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Choose</span>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => onSelectBgColor(e.target.value)}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`p-2 rounded-2xl flex items-center justify-center shadow-sm transition-all cursor-pointer ${
            darkMode ? 'glass-panel-dark text-amber-400 hover:text-amber-300' : 'glass-panel text-slate-600 hover:text-slate-900'
          }`}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Collaborators Avatar Stack */}
        <div className={`px-3 py-1.5 rounded-2xl flex items-center gap-2 shadow-sm transition-all ${
          darkMode ? 'glass-panel-dark' : 'glass-panel'
        }`}>
          <div className="flex -space-x-2 overflow-hidden items-center">
            {users.slice(0, 5).map((u) => {
              const isMe = myUser && myUser.id === u.id;
              return (
                <div
                  key={u.id}
                  title={`${u.name}${isMe ? ' (You)' : ''}`}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-800 text-white text-[11px] font-semibold flex items-center justify-center uppercase shadow-sm select-none"
                  style={{ backgroundColor: u.color || '#3b82f6' }}
                >
                  {u.name ? u.name.charAt(0) : '?'}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1 pl-1 text-xs font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
              {users.length}
            </span>
          </div>
        </div>

        {/* Grid and Export Utility Buttons */}
        <div className={`p-1 rounded-2xl flex items-center gap-0.5 shadow-sm transition-all ${
          darkMode ? 'glass-panel-dark' : 'glass-panel'
        }`}>
          {/* Toggle Canvas Grid */}
          <button
            onClick={() => setGridEnabled((prev) => !prev)}
            title={gridEnabled ? 'Disable Grid Dots' : 'Enable Grid Dots'}
            className={`p-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-center ${
              gridEnabled
                ? darkMode ? 'bg-slate-800 text-blue-400' : 'bg-slate-100 text-blue-600'
                : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Export PNG */}
          <button
            onClick={onExportPNG}
            title="Download Whiteboard as PNG"
            className={`p-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-center ${
              darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Network status icon */}
        <div
          title={connected ? 'Connected to collaboration server' : 'Disconnected from server'}
          className={`p-2 rounded-2xl flex items-center justify-center shadow-sm ${
            darkMode ? 'glass-panel-dark' : 'glass-panel'
          } ${connected ? 'text-emerald-500' : 'text-red-500'}`}
        >
          {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        </div>
      </div>
    </header>
  );
}
