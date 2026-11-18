import React, { useRef, useEffect, useState, useCallback } from 'react';

function isDarkColor(hex) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
  let c = hex.substring(1);
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000 < 130;
}

export default function Whiteboard({
  activeTool,
  color,
  strokeWidth,
  shapeFill = false,
  gridEnabled = true,
  bgColor = '#f8fafc',
  socket,
  emitDraw,
  emitCursor,
  emitUndo,
  initialStrokes = [],
  exportTrigger
}) {
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const lastPointRef = useRef({ x: 0, y: 0 });
  const strokesRef = useRef([]);
  const lastCursorEmitRef = useRef(0);
  const currentStrokeIdRef = useRef(null);

  // Text tool state
  const [editingText, setEditingText] = useState(null);
  const textInputRef = useRef(null);

  useEffect(() => {
    if (editingText && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
    }
  }, [editingText]);

  // Unified Renderer
  const renderItem = useCallback((ctx, item) => {
    if (!item) return;

    ctx.save();

    // 1. Text Item
    if (item.type === 'text') {
      const fontSize = item.fontSize || 22;
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = item.color || '#1e293b';
      ctx.textBaseline = 'top';

      const lines = (item.text || '').split('\n');
      const lineHeight = fontSize * 1.35;
      lines.forEach((line, index) => {
        ctx.fillText(line, item.x, item.y + index * lineHeight);
      });
      ctx.restore();
      return;
    }

    // 2. Shape Item
    if (item.type === 'shape') {
      const { shapeType, x0, y0, x1, y1, color: shapeColor, width, fill } = item;
      ctx.strokeStyle = shapeColor || '#1e293b';
      ctx.lineWidth = width || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (fill) {
        ctx.fillStyle = shapeColor.startsWith('#') ? `${shapeColor}26` : 'rgba(59, 130, 246, 0.15)';
      }

      ctx.beginPath();

      if (shapeType === 'rect') {
        const x = Math.min(x0, x1);
        const y = Math.min(y0, y1);
        const w = Math.abs(x1 - x0);
        const h = Math.abs(y1 - y0);
        if (fill) ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      } else if (shapeType === 'square') {
        const side = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        const x = x1 >= x0 ? x0 : x0 - side;
        const y = y1 >= y0 ? y0 : y0 - side;
        if (fill) ctx.fillRect(x, y, side, side);
        ctx.strokeRect(x, y, side, side);
      } else if (shapeType === 'circle') {
        const radius = Math.hypot(x1 - x0, y1 - y0) / 2;
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        if (fill) ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
      return;
    }

    // 3. Freehand / Dot Stroke
    ctx.beginPath();
    ctx.moveTo(item.x0, item.y0);
    ctx.lineTo(item.x1, item.y1);

    if (item.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = Math.max(item.width * 2.5, 16);
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.width;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }, []);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const item of strokesRef.current) {
      renderItem(ctx, item);
    }
  }, [renderItem]);

  const resizeCanvas = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
    if (previewCanvasRef.current) {
      previewCanvasRef.current.width = width;
      previewCanvasRef.current.height = height;
    }

    redrawAll();
  }, [redrawAll]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    if (initialStrokes && initialStrokes.length > 0) {
      strokesRef.current = [...initialStrokes];
      redrawAll();
    } else {
      strokesRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [initialStrokes, redrawAll]);

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (strokesRef.current.length === 0) return;

    // Identify last performed action ID
    const lastItem = strokesRef.current[strokesRef.current.length - 1];
    const targetStrokeId = lastItem.strokeId;

    if (targetStrokeId) {
      strokesRef.current = strokesRef.current.filter((item) => item.strokeId !== targetStrokeId);
      if (emitUndo) emitUndo(targetStrokeId);
    } else {
      strokesRef.current.pop();
      if (emitUndo) emitUndo(null);
    }

    redrawAll();
  }, [emitUndo, redrawAll]);

  // Ctrl+Z / Cmd+Z Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('whiteboard_undo', handleUndo);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('whiteboard_undo', handleUndo);
    };
  }, [handleUndo]);

  // Socket listeners
  useEffect(() => {
    const handleReceiveDraw = (item) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      renderItem(ctx, item);
      strokesRef.current.push(item);
    };

    const handleReceiveClear = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      if (previewCanvasRef.current) {
        const pCtx = previewCanvasRef.current.getContext('2d');
        pCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
      }
      strokesRef.current = [];
      setEditingText(null);
    };

    const handleReceiveUndo = ({ strokeId }) => {
      if (strokeId) {
        strokesRef.current = strokesRef.current.filter((item) => item.strokeId !== strokeId);
      } else {
        strokesRef.current.pop();
      }
      redrawAll();
    };

    if (socket) {
      socket.on('receive_draw', handleReceiveDraw);
      socket.on('receive_clear_canvas', handleReceiveClear);
      socket.on('receive_undo', handleReceiveUndo);
    }

    window.addEventListener('whiteboard_clear', handleReceiveClear);

    return () => {
      if (socket) {
        socket.off('receive_draw', handleReceiveDraw);
        socket.off('receive_clear_canvas', handleReceiveClear);
        socket.off('receive_undo', handleReceiveUndo);
      }
      window.removeEventListener('whiteboard_clear', handleReceiveClear);
    };
  }, [socket, renderItem, redrawAll]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Commit text to canvas
  const commitText = useCallback(() => {
    if (!editingText) return;
    const trimmed = (editingText.text || '').trim();

    if (trimmed.length > 0) {
      const textId = 'text_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const textItem = {
        type: 'text',
        strokeId: textId,
        text: editingText.text,
        x: editingText.x,
        y: editingText.y,
        color: color,
        fontSize: editingText.fontSize || 22
      };

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        renderItem(ctx, textItem);
      }

      strokesRef.current.push(textItem);
      emitDraw(textItem);
    }

    setEditingText(null);
  }, [editingText, color, renderItem, emitDraw]);

  // Pointer Handlers
  const handlePointerDown = (e) => {
    const coords = getCoordinates(e);

    // If text tool active
    if (activeTool === 'text') {
      if (editingText) {
        commitText();
      }
      setEditingText({
        x: coords.x,
        y: coords.y,
        text: '',
        fontSize: Math.max(18, strokeWidth * 3.5)
      });
      return;
    }

    if (editingText) {
      commitText();
    }

    isDrawingRef.current = true;
    startPointRef.current = coords;
    lastPointRef.current = coords;

    // Generate unique strokeId for grouping continuous drag action
    const currentId = 'stroke_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    currentStrokeIdRef.current = currentId;

    if (activeTool === 'pen' || activeTool === 'eraser') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const dotItem = {
        type: 'stroke',
        strokeId: currentId,
        x0: coords.x,
        y0: coords.y,
        x1: coords.x + 0.01,
        y1: coords.y + 0.01,
        color,
        width: strokeWidth,
        tool: activeTool
      };
      renderItem(ctx, dotItem);
      strokesRef.current.push(dotItem);
      emitDraw(dotItem);
    }
  };

  const handlePointerMove = (e) => {
    const coords = getCoordinates(e);

    const now = Date.now();
    if (now - lastCursorEmitRef.current > 30) {
      emitCursor(coords.x, coords.y);
      lastCursorEmitRef.current = now;
    }

    if (!isDrawingRef.current) return;

    const isShape = activeTool === 'circle' || activeTool === 'square' || activeTool === 'rect';

    if (isShape) {
      const previewCanvas = previewCanvasRef.current;
      if (!previewCanvas) return;
      const pCtx = previewCanvas.getContext('2d');

      pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

      const previewShape = {
        type: 'shape',
        shapeType: activeTool,
        x0: startPointRef.current.x,
        y0: startPointRef.current.y,
        x1: coords.x,
        y1: coords.y,
        color,
        width: strokeWidth,
        fill: shapeFill
      };
      renderItem(pCtx, previewShape);
    } else if (activeTool === 'pen' || activeTool === 'eraser') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const p0 = lastPointRef.current;
      const p1 = coords;

      const segment = {
        type: 'stroke',
        strokeId: currentStrokeIdRef.current,
        x0: p0.x,
        y0: p0.y,
        x1: p1.x,
        y1: p1.y,
        color,
        width: strokeWidth,
        tool: activeTool
      };

      renderItem(ctx, segment);
      strokesRef.current.push(segment);
      emitDraw(segment);

      lastPointRef.current = p1;
    }
  };

  const handlePointerUp = (e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const isShape = activeTool === 'circle' || activeTool === 'square' || activeTool === 'rect';

    if (isShape) {
      const coords = getCoordinates(e);
      const previewCanvas = previewCanvasRef.current;
      if (previewCanvas) {
        const pCtx = previewCanvas.getContext('2d');
        pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      }

      const dx = coords.x - startPointRef.current.x;
      const dy = coords.y - startPointRef.current.y;
      if (Math.hypot(dx, dy) >= 3) {
        const shapeId = 'shape_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        const shapeItem = {
          type: 'shape',
          strokeId: shapeId,
          shapeType: activeTool,
          x0: startPointRef.current.x,
          y0: startPointRef.current.y,
          x1: coords.x,
          y1: coords.y,
          color,
          width: strokeWidth,
          fill: shapeFill
        };

        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          renderItem(ctx, shapeItem);
        }

        strokesRef.current.push(shapeItem);
        emitDraw(shapeItem);
      }
    }

    currentStrokeIdRef.current = null;
  };

  // Export PNG
  useEffect(() => {
    if (!exportTrigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const oCtx = offscreen.getContext('2d');

    oCtx.fillStyle = bgColor || '#ffffff';
    oCtx.fillRect(0, 0, offscreen.width, offscreen.height);
    oCtx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = offscreen.toDataURL('image/png');
    link.click();
  }, [exportTrigger, bgColor]);

  const darkBg = isDarkColor(bgColor);

  return (
    <div 
      className="relative w-full h-full overflow-hidden touch-none"
      style={{ backgroundColor: bgColor }}
    >
      {/* Main Persistent Artwork Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full absolute inset-0 transition-colors duration-200 ${
          activeTool === 'text' ? 'cursor-text' : 'cursor-crosshair'
        } ${gridEnabled ? (darkBg ? 'canvas-grid-dark' : 'canvas-grid-light') : ''}`}
      />

      {/* Transparent Shape Preview Canvas & Event Layer */}
      <canvas
        ref={previewCanvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onTouchCancel={handlePointerUp}
        className={`w-full h-full absolute inset-0 z-10 ${
          activeTool === 'text' ? 'cursor-text' : 'cursor-crosshair'
        }`}
      />

      {/* Interactive Text Input Modal / Card */}
      {editingText && (
        <div
          className="absolute z-50 pointer-events-auto"
          style={{
            left: `${Math.min(Math.max(editingText.x, 16), window.innerWidth - 330)}px`,
            top: `${Math.min(Math.max(editingText.y, 16), window.innerHeight - 200)}px`
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="p-3 rounded-2xl shadow-2xl border flex flex-col gap-2 min-w-[280px] max-w-[340px] bg-white/95 text-slate-800 border-slate-200 dark:bg-slate-900/95 dark:text-white dark:border-slate-700 backdrop-blur-md">
            <div className="flex items-center justify-between border-b pb-1.5 border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                ✏️ Write Text
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                {[16, 22, 32, 44].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setEditingText((prev) => ({ ...prev, fontSize: size }))}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                      editingText.fontSize === size
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {size === 16 ? 'S' : size === 22 ? 'M' : size === 32 ? 'L' : 'XL'}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              ref={textInputRef}
              rows={2}
              value={editingText.text}
              placeholder="Type here... (inside shapes or anywhere)"
              onChange={(e) =>
                setEditingText((prev) => ({ ...prev, text: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  commitText();
                } else if (e.key === 'Escape') {
                  setEditingText(null);
                }
              }}
              style={{
                color: color,
                fontSize: `${editingText.fontSize || 22}px`,
                userSelect: 'text',
                WebkitUserSelect: 'text'
              }}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-blue-400/50 focus:border-blue-500 rounded-xl p-2 outline-none resize-none font-sans font-medium placeholder-slate-400 shadow-inner"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 select-none">
                Enter ↵ to save
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingText(null)}
                  className="px-2.5 py-1 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commitText}
                  className="px-3.5 py-1 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 transition-colors"
                >
                  ✓ Place Text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
