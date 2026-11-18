import React from 'react';
import { 
  Pencil, 
  Eraser, 
  Circle,
  Square,
  RectangleHorizontal,
  Type,
  PaintBucket,
  Trash2, 
  Palette 
} from 'lucide-react';

const LIGHT_PRESET_COLORS = [
  { name: 'Slate Black', value: '#1e293b' },
  { name: 'Crimson Red', value: '#ef4444' },
  { name: 'Royal Blue', value: '#3b82f6' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Violet Purple', value: '#8b5cf6' },
  { name: 'Amber Orange', value: '#f97316' }
];

const DARK_PRESET_COLORS = [
  { name: 'Pure White', value: '#f8fafc' },
  { name: 'Crimson Red', value: '#f87171' },
  { name: 'Sky Blue', value: '#38bdf8' },
  { name: 'Emerald Mint', value: '#34d399' },
  { name: 'Lavender Violet', value: '#a78bfa' },
  { name: 'Amber Orange', value: '#fb923c' }
];

const STROKE_WIDTHS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 5 },
  { label: 'Thick', value: 10 },
  { label: 'Marker', value: 20 }
];

export default function Toolbar({
  activeTool,
  setActiveTool,
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  shapeFill = false,
  setShapeFill,
  onClearCanvas,
  darkMode = false
}) {
  const presetColors = darkMode ? DARK_PRESET_COLORS : LIGHT_PRESET_COLORS;

  const isShapeTool = activeTool === 'circle' || activeTool === 'square' || activeTool === 'rect';

  return (
    <aside 
      aria-label="Drawing Tools"
      className={`absolute left-4 top-20 z-30 flex flex-col items-center gap-2.5 p-2 rounded-2xl shadow-xl transition-all duration-200 ${
        darkMode ? 'glass-panel-dark' : 'glass-panel'
      }`}
    >
      {/* Primary Tools: Pen, Eraser, Text */}
      <div className={`flex flex-col gap-1 p-1 rounded-xl ${darkMode ? 'bg-slate-800/80' : 'bg-slate-100/80'}`}>
        <button
          title="Pen (P)"
          onClick={() => setActiveTool('pen')}
          className={`p-2.5 rounded-lg transition-all duration-150 flex items-center justify-center ${
            activeTool === 'pen'
              ? darkMode
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'bg-white text-blue-600 shadow-sm font-semibold'
              : darkMode
                ? 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button
          title="Eraser (E)"
          onClick={() => setActiveTool('eraser')}
          className={`p-2.5 rounded-lg transition-all duration-150 flex items-center justify-center ${
            activeTool === 'eraser'
              ? darkMode
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'bg-white text-blue-600 shadow-sm font-semibold'
              : darkMode
                ? 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Eraser className="w-4 h-4" />
        </button>

        <button
          title="Text Tool (T) - Click anywhere on canvas or inside shapes to type"
          onClick={() => setActiveTool('text')}
          className={`p-2.5 rounded-lg transition-all duration-150 flex items-center justify-center ${
            activeTool === 'text'
              ? darkMode
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'bg-white text-blue-600 shadow-sm font-semibold'
              : darkMode
                ? 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Type className="w-4 h-4" />
        </button>
      </div>

      <div className={`w-8 h-[1px] my-0.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-200/80'}`} />

      {/* Geometric Shapes: Circle, Square, Rectangle */}
      <div className={`flex flex-col gap-1 p-1 rounded-xl ${darkMode ? 'bg-slate-800/80' : 'bg-slate-100/80'}`}>
        <button
          title="Circle (C) - Drag to draw circle"
          onClick={() => setActiveTool('circle')}
          className={`p-2.5 rounded-lg transition-all duration-150 flex items-center justify-center ${
            activeTool === 'circle'
              ? darkMode
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'bg-white text-blue-600 shadow-sm font-semibold'
              : darkMode
                ? 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Circle className="w-4 h-4" />
        </button>

        <button
          title="Square (S) - Drag to draw 1:1 square"
          onClick={() => setActiveTool('square')}
          className={`p-2.5 rounded-lg transition-all duration-150 flex items-center justify-center ${
            activeTool === 'square'
              ? darkMode
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'bg-white text-blue-600 shadow-sm font-semibold'
              : darkMode
                ? 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Square className="w-4 h-4" />
        </button>

        <button
          title="Rectangle (R) - Drag to draw rectangle"
          onClick={() => setActiveTool('rect')}
          className={`p-2.5 rounded-lg transition-all duration-150 flex items-center justify-center ${
            activeTool === 'rect'
              ? darkMode
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'bg-white text-blue-600 shadow-sm font-semibold'
              : darkMode
                ? 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <RectangleHorizontal className="w-4 h-4" />
        </button>

        {/* Toggle Fill inside shapes */}
        <button
          title={shapeFill ? 'Shape Fill: On (Click to Outline only)' : 'Shape Fill: Off (Click to Enable Fill)'}
          onClick={() => setShapeFill(!shapeFill)}
          className={`p-2 rounded-lg transition-all duration-150 flex items-center justify-center text-xs ${
            shapeFill
              ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-400/50 font-semibold'
              : darkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <PaintBucket className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className={`w-8 h-[1px] my-0.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-200/80'}`} />

      {/* Color Palette Picker */}
      <div className="flex flex-col items-center gap-1.5">
        <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl ${darkMode ? 'bg-slate-800/80' : 'bg-slate-100/80'}`}>
          {presetColors.map((c) => (
            <button
              key={c.value}
              title={c.name}
              onClick={() => {
                setColor(c.value);
                if (activeTool === 'eraser') setActiveTool('pen');
              }}
              className={`w-5 h-5 rounded-full transition-transform duration-150 relative flex items-center justify-center ${
                color === c.value && activeTool !== 'eraser'
                  ? 'scale-110 ring-2 ring-blue-500 ring-offset-2'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        {/* Custom Color Input */}
        <label 
          title="Custom Color"
          className={`relative cursor-pointer p-1.5 rounded-lg transition-colors ${
            darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              if (activeTool === 'eraser') setActiveTool('pen');
            }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>

      <div className={`w-8 h-[1px] my-0.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-200/80'}`} />

      {/* Stroke Width Selector */}
      <div className={`flex flex-col items-center gap-1.5 p-1 rounded-xl ${darkMode ? 'bg-slate-800/80' : 'bg-slate-100/80'}`}>
        <div className="flex flex-col gap-1">
          {STROKE_WIDTHS.map((sw) => (
            <button
              key={sw.value}
              title={`${sw.label} (${sw.value}px)`}
              onClick={() => setStrokeWidth(sw.value)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                strokeWidth === sw.value
                  ? darkMode ? 'bg-slate-700 shadow-sm ring-1 ring-slate-500' : 'bg-white shadow-sm ring-1 ring-slate-300'
                  : darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-white/60'
              }`}
            >
              <span
                className={`rounded-full ${darkMode ? 'bg-slate-200' : 'bg-slate-800'}`}
                style={{
                  width: Math.min(Math.max(sw.value, 3), 14),
                  height: Math.min(Math.max(sw.value, 3), 14)
                }}
              />
            </button>
          ))}
        </div>

        {/* Dynamic Stroke Width Slider */}
        <div className="w-16 pt-1 pb-0.5 px-0.5 flex flex-col items-center">
          <input
            type="range"
            min="1"
            max="40"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-14 h-1 bg-slate-400/40 rounded-lg appearance-none cursor-pointer accent-blue-600"
            title={`Thickness: ${strokeWidth}px`}
          />
          <span className={`text-[9px] mt-0.5 font-mono font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {strokeWidth}px
          </span>
        </div>
      </div>

      <div className={`w-8 h-[1px] my-0.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-200/80'}`} />

      {/* Wipe / Clear Board Action */}
      <button
        title="Clear Entire Canvas"
        onClick={onClearCanvas}
        className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors flex items-center justify-center"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </aside>
  );
}
