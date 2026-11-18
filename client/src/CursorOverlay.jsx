import React from 'react';

export default function CursorOverlay({ cursors }) {
  const cursorEntries = Object.entries(cursors || {});
  if (cursorEntries.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {cursorEntries.map(([userId, cursor]) => {
        const { x, y, name, color = '#3b82f6' } = cursor;
        return (
          <div
            key={userId}
            className="absolute transition-transform duration-75 ease-out will-change-transform pointer-events-none"
            style={{
              transform: `translate(${x}px, ${y}px)`,
              left: 0,
              top: 0
            }}
          >
            <svg
              className="w-5 h-5 drop-shadow-md"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                fill={color}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className="ml-3 px-2 py-0.5 rounded-full text-xs font-semibold text-white shadow-md tracking-wide whitespace-nowrap inline-block -mt-1 select-none"
              style={{
                backgroundColor: color,
                boxShadow: `0 2px 8px ${color}55`
              }}
            >
              {name || 'Collaborator'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
