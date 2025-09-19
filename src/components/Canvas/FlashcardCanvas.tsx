import { useCallback, useRef, useEffect, useState } from 'react';
import { Flashcard, CanvasState, CanvasTool, Position, FlashcardSide, Arrow } from '../../types';
import { CanvasUtils } from '../../utils/canvasUtils';

interface FlashcardCanvasProps {
  flashcard: Flashcard;
  canvasState: CanvasState;
  selectedTool: CanvasTool;
  onSideSelect: (sideId: string, multiSelect?: boolean) => void;
  onSideMove: (sideId: string, newPosition: Position) => void;
  onSideTextUpdate: (sideId: string, newText: string) => void;
  onArrowCreate: (sourceId: string, destinationId: string) => void;
  onArrowTextUpdate: (arrowId: string, newText: string) => void;
  onArrowSelect: (arrowId: string, multiSelect?: boolean) => void;
  onCanvasClick: (position: Position) => void;
  onZoomChange: (newZoom: number) => void;
  onPanChange: (newOffset: Position) => void;
  newSideForEditing?: string | null;
  newArrowForEditing?: string | null;
  onEditingComplete?: () => void;
}

interface EditingState {
  sideId: string | null;
  text: string;
  inputRect: DOMRect | null;
}

interface ArrowEditingState {
  arrowId: string | null;
  text: string;
  inputRect: DOMRect | null;
}

export const FlashcardCanvas: React.FC<FlashcardCanvasProps> = ({
  flashcard,
  canvasState,
  selectedTool,
  onSideSelect,
  onSideMove,
  onSideTextUpdate,
  onArrowCreate,
  onArrowTextUpdate,
  onArrowSelect,
  onCanvasClick,
  onZoomChange,
  onPanChange,
  newSideForEditing,
  newArrowForEditing,
  onEditingComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [dragSideId, setDragSideId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position | null>(null);
  const [hoverSideId, setHoverSideId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  const [editing, setEditing] = useState<EditingState>({ sideId: null, text: '', inputRect: null });
  const [arrowEditing, setArrowEditing] = useState<ArrowEditingState>({ arrowId: null, text: '', inputRect: null });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position | null>(null);

  // Constants for rendering (base sizes, scaling handled in drawing)
  const SIDE_WIDTH = 120;
  const SIDE_HEIGHT = 80;
  const CLICK_TOLERANCE = 5;

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }, []);

  const drawSide = useCallback((ctx: CanvasRenderingContext2D, side: FlashcardSide) => {
    const screenPos = CanvasUtils.canvasToScreen(side.position, canvasState);
    const width = (side.width || SIDE_WIDTH) * canvasState.zoom;
    const height = (side.height || SIDE_HEIGHT) * canvasState.zoom;

    // Determine side styling based on state
    const isSelected = canvasState.selectedSideIds.includes(side.id);
    const isHovered = hoverSideId === side.id;
    const isSourceForArrow = canvasState.arrowSourceId === side.id;
    const isEditing = editing.sideId === side.id;

    // Background
    ctx.fillStyle = isSourceForArrow ? '#e3f2fd' : (isSelected ? '#e8f4fd' : '#ffffff');
    ctx.fillRect(screenPos.x, screenPos.y, width, height);

    // Border
    ctx.strokeStyle = isSourceForArrow ? '#2196f3' : (isSelected ? '#3498db' : (isHovered ? '#74b9ff' : '#000000'));
    ctx.lineWidth = isSelected || isSourceForArrow ? 2 : 1;
    ctx.strokeRect(screenPos.x, screenPos.y, width, height);

    // Text (if not editing)
    if (!isEditing && side.value) {
      ctx.fillStyle = '#2c3e50';
      ctx.font = `${(side.fontSize || 14) * canvasState.zoom}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textX = screenPos.x + width / 2;
      const textY = screenPos.y + height / 2;

      // Simple text wrapping
      const maxWidth = width - 10;
      const words = side.value.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) lines.push(currentLine);

      const lineHeight = ((side.fontSize || 14) + 2) * canvasState.zoom;
      const totalHeight = lines.length * lineHeight;
      const startY = textY - totalHeight / 2 + lineHeight / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, textX, startY + index * lineHeight);
      });
    }

    // Red border for empty sides (with hover effect)
    if (!side.value || side.value.trim() === '') {
      ctx.strokeStyle = isHovered ? '#8b2635' : '#e74c3c';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.strokeRect(screenPos.x, screenPos.y, width, height);

      // Add a subtle background tint on hover for empty sides
      if (isHovered) {
        ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
        ctx.fillRect(screenPos.x, screenPos.y, width, height);
      }
    }
  }, [canvasState, hoverSideId, editing, SIDE_WIDTH, SIDE_HEIGHT]);

  const calculateArrowPath = useCallback((arrow: Arrow): Position[] => {
    // Use the new advanced arrow path calculation
    const canvasPath = CanvasUtils.calculateAdvancedArrowPath(arrow, flashcard.arrows, flashcard.sides);

    // Convert canvas coordinates to screen coordinates
    return canvasPath.map(point => CanvasUtils.canvasToScreen(point, canvasState));
  }, [flashcard.sides, flashcard.arrows, canvasState]);

  const drawArrow = useCallback((ctx: CanvasRenderingContext2D, arrow: Arrow) => {
    const path = calculateArrowPath(arrow);
    if (path.length < 2) return;

    const isSelected = canvasState.selectedArrowIds.includes(arrow.id);
    const isEditing = arrowEditing.arrowId === arrow.id;

    ctx.strokeStyle = isSelected ? '#3498db' : (arrow.color || '#6c757d');
    ctx.lineWidth = (isSelected ? 3 : 2) * canvasState.zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw the path
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();

    // Draw arrowhead at the end
    if (path.length >= 2) {
      const lastPoint = path[path.length - 1];
      const secondLastPoint = path[path.length - 2];

      const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x);
      const headLength = 12 * canvasState.zoom;
      const headAngle = Math.PI / 6;

      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(
        lastPoint.x - headLength * Math.cos(angle - headAngle),
        lastPoint.y - headLength * Math.sin(angle - headAngle)
      );
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(
        lastPoint.x - headLength * Math.cos(angle + headAngle),
        lastPoint.y - headLength * Math.sin(angle + headAngle)
      );
      ctx.stroke();
    }

    // Draw label (if not editing and has label, or if empty and not editing)
    if (!isEditing && path.length >= 2) {
      const midIndex = Math.floor(path.length / 2);
      const labelPos = path[midIndex];
      const displayText = arrow.label || '  '; // Show 2 spaces for empty labels

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = arrow.label ? '#dee2e6' : '#e74c3c'; // Red border for empty labels
      ctx.lineWidth = (arrow.label ? 1 : 2) * canvasState.zoom;

      const fontSize = 12 * canvasState.zoom;
      const font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif`;
      ctx.font = font;
      const metrics = ctx.measureText(displayText);
      const padding = 6 * canvasState.zoom;
      const labelWidth = Math.max(metrics.width + padding * 2, 24 * canvasState.zoom); // Minimum width for empty labels
      const labelHeight = 24 * canvasState.zoom;

      const labelRect = {
        x: labelPos.x - labelWidth / 2,
        y: labelPos.y - labelHeight / 2,
        width: labelWidth,
        height: labelHeight
      };

      ctx.fillRect(labelRect.x, labelRect.y, labelRect.width, labelRect.height);
      ctx.strokeRect(labelRect.x, labelRect.y, labelRect.width, labelRect.height);

      if (arrow.label) {
        ctx.fillStyle = '#2c3e50';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(arrow.label, labelPos.x, labelPos.y);
      }
    }
  }, [calculateArrowPath, canvasState.selectedArrowIds, arrowEditing]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas ref is null');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Canvas context is null');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    console.log('Drawing canvas:', rect.width, 'x', rect.height);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw a test background to verify canvas is working
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw grid if enabled
    if (canvasState.gridSnapEnabled) {
      CanvasUtils.drawGrid(ctx, canvasState, rect.width, rect.height);
    }

    // Draw arrows first (behind sides)
    flashcard.arrows.forEach(arrow => {
      drawArrow(ctx, arrow);
    });

    // Draw sides
    flashcard.sides.forEach(side => {
      drawSide(ctx, side);
    });

    // Draw arrow preview if creating arrow
    if (canvasState.isCreatingArrow && canvasState.arrowSourceId) {
      const sourceCenter = CanvasUtils.getSideCenter(
        flashcard.sides.find(s => s.id === canvasState.arrowSourceId)!
      );
      const screenSourceCenter = CanvasUtils.canvasToScreen(sourceCenter, canvasState);

      ctx.strokeStyle = '#adb5bd';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(screenSourceCenter.x, screenSourceCenter.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw side preview when placing a new side
    if (selectedTool === 'add-side') {
      // Convert mouse screen position to canvas coordinates properly
      const canvasMousePos = {
        x: (mousePos.x - canvasState.panOffset.x) / canvasState.zoom,
        y: (mousePos.y - canvasState.panOffset.y) / canvasState.zoom
      };

      // Center the preview on the cursor by offsetting by half the side dimensions
      const centeredCanvasPos = {
        x: canvasMousePos.x - SIDE_WIDTH / 2,
        y: canvasMousePos.y - SIDE_HEIGHT / 2
      };

      const previewPos = canvasState.gridSnapEnabled
        ? CanvasUtils.snapToGrid(centeredCanvasPos, canvasState.gridSize)
        : centeredCanvasPos;
      const screenPreviewPos = CanvasUtils.canvasToScreen(previewPos, canvasState);

      const previewWidth = SIDE_WIDTH * canvasState.zoom;
      const previewHeight = SIDE_HEIGHT * canvasState.zoom;

      // Draw preview side with dashed border
      ctx.strokeStyle = '#3498db';
      ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      ctx.fillRect(screenPreviewPos.x, screenPreviewPos.y, previewWidth, previewHeight);
      ctx.strokeRect(screenPreviewPos.x, screenPreviewPos.y, previewWidth, previewHeight);
      ctx.setLineDash([]);

      // Add preview text
      ctx.fillStyle = '#6c757d';
      ctx.font = `${12 * canvasState.zoom}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        'New Side',
        screenPreviewPos.x + previewWidth / 2,
        screenPreviewPos.y + previewHeight / 2
      );
    }

    console.log('Canvas draw complete. Sides:', flashcard.sides.length, 'Arrows:', flashcard.arrows.length);
  }, [flashcard, canvasState, drawSide, drawArrow, mousePos]);

  const getCanvasPosition = useCallback((event: MouseEvent | React.MouseEvent): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (screenX - canvasState.panOffset.x) / canvasState.zoom;
    const canvasY = (screenY - canvasState.panOffset.y) / canvasState.zoom;

    return { x: canvasX, y: canvasY };
  }, [canvasState]);

  const findSideAtPosition = useCallback((position: Position): FlashcardSide | null => {
    for (const side of flashcard.sides) {
      if (CanvasUtils.isPointInSide(position, side)) {
        return side;
      }
    }
    return null;
  }, [flashcard.sides]);

  useEffect(() => {
    const handleResize = () => {
      resizeCanvas();
      setTimeout(drawCanvas, 0); // Defer draw to avoid circular dependency
    };

    resizeCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resizeCanvas, drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Auto-trigger editing for new sides
  useEffect(() => {
    if (newSideForEditing) {
      const side = flashcard.sides.find(s => s.id === newSideForEditing);
      if (side && canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const screenPos = CanvasUtils.canvasToScreen(side.position, canvasState);
        const inputRect = new DOMRect(
          rect.left + screenPos.x,
          rect.top + screenPos.y,
          side.width || SIDE_WIDTH,
          side.height || SIDE_HEIGHT
        );

        setEditing({
          sideId: side.id,
          text: side.value,
          inputRect
        });

        if (onEditingComplete) {
          onEditingComplete();
        }
      }
    }
  }, [newSideForEditing, flashcard.sides, canvasState, onEditingComplete, SIDE_WIDTH, SIDE_HEIGHT]);

  // Auto-trigger editing for new arrows
  useEffect(() => {
    if (newArrowForEditing) {
      const arrow = flashcard.arrows.find(a => a.id === newArrowForEditing);
      if (arrow && canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Calculate arrow midpoint for label position
        const path = calculateArrowPath(arrow);
        if (path.length >= 2) {
          const midIndex = Math.floor(path.length / 2);
          const labelPos = path[midIndex];

          const labelWidth = Math.max(100, 24); // Minimum width for input
          const labelHeight = 24;

          const inputRect = new DOMRect(
            rect.left + labelPos.x - labelWidth / 2,
            rect.top + labelPos.y - labelHeight / 2,
            labelWidth,
            labelHeight
          );

          setArrowEditing({
            arrowId: arrow.id,
            text: arrow.label,
            inputRect
          });
        }

        if (onEditingComplete) {
          onEditingComplete();
        }
      }
    }
  }, [newArrowForEditing, flashcard.arrows, canvasState, calculateArrowPath, onEditingComplete]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvasPos = getCanvasPosition(event);
    const clickedSide = findSideAtPosition(canvasPos);

    if (selectedTool === 'add-side' && !clickedSide) {
      // Create new side centered on click position
      const centeredPos = {
        x: canvasPos.x - SIDE_WIDTH / 2,
        y: canvasPos.y - SIDE_HEIGHT / 2
      };
      const snappedPos = canvasState.gridSnapEnabled
        ? CanvasUtils.snapToGrid(centeredPos, canvasState.gridSize)
        : centeredPos;
      onCanvasClick(snappedPos);
    } else if (selectedTool === 'add-arrow') {
      if (clickedSide) {
        if (!canvasState.isCreatingArrow) {
          // Start arrow creation
          onSideSelect(clickedSide.id);
        } else if (canvasState.arrowSourceId && clickedSide.id !== canvasState.arrowSourceId) {
          // Complete arrow creation
          onArrowCreate(canvasState.arrowSourceId, clickedSide.id);
        }
      } else {
        // Cancel arrow creation
        onCanvasClick(canvasPos);
      }
    } else if (selectedTool === 'select') {
      if (clickedSide) {
        onSideSelect(clickedSide.id, event.ctrlKey || event.metaKey);
      } else {
        // Check if an arrow was clicked
        const clickedArrow = findArrowAtPosition(canvasPos);
        if (clickedArrow) {
          // Select the arrow
          onArrowSelect(clickedArrow.id, event.ctrlKey || event.metaKey);
        } else {
          // Clear selection
          onSideSelect('', false);
        }
      }
    }
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenPos = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    if (selectedTool === 'pan' || event.button === 2) {
      // Pan tool or right mouse button
      event.preventDefault(); // Prevent context menu on right click
      setIsPanning(true);
      setPanStart(screenPos);
      return;
    }

    if (selectedTool !== 'select') return;

    const canvasPos = getCanvasPosition(event);
    const clickedSide = findSideAtPosition(canvasPos);

    if (clickedSide && canvasState.selectedSideIds.includes(clickedSide.id)) {
      setIsDragging(true);
      setDragStart(canvasPos);
      setDragSideId(clickedSide.id);

      // Calculate offset from click position to side's top-left corner
      const clickOffset = {
        x: canvasPos.x - clickedSide.position.x,
        y: canvasPos.y - clickedSide.position.y
      };
      setDragOffset(clickOffset);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenPos = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    setMousePos(screenPos);

    // Handle panning
    if (isPanning && panStart) {
      const deltaX = screenPos.x - panStart.x;
      const deltaY = screenPos.y - panStart.y;

      const newPanOffset = {
        x: canvasState.panOffset.x + deltaX,
        y: canvasState.panOffset.y + deltaY
      };

      onPanChange(newPanOffset);
      setPanStart(screenPos);
      return;
    }

    const canvasPos = getCanvasPosition(event);
    const hoveredSide = findSideAtPosition(canvasPos);
    setHoverSideId(hoveredSide?.id || null);

    if (isDragging && dragSideId && dragOffset) {
      const side = flashcard.sides.find(s => s.id === dragSideId);
      if (side) {
        // Calculate new position by subtracting the click offset from current mouse position
        const newPosition = {
          x: canvasPos.x - dragOffset.x,
          y: canvasPos.y - dragOffset.y
        };

        const snappedPosition = canvasState.gridSnapEnabled
          ? CanvasUtils.snapToGrid(newPosition, canvasState.gridSize)
          : newPosition;

        onSideMove(dragSideId, snappedPosition);
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setDragSideId(null);
    setDragOffset(null);
    setIsPanning(false);
    setPanStart(null);
  };

  const handleCanvasWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, canvasState.zoom * zoomFactor));

    // Zoom towards mouse position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Calculate world position of mouse before zoom
      const worldX = (mouseX - canvasState.panOffset.x) / canvasState.zoom;
      const worldY = (mouseY - canvasState.panOffset.y) / canvasState.zoom;

      // Calculate new pan offset to keep mouse point fixed
      const newPanOffset = {
        x: mouseX - worldX * newZoom,
        y: mouseY - worldY * newZoom
      };

      onZoomChange(newZoom);
      onPanChange(newPanOffset);
    }
  };

  const findArrowAtPosition = useCallback((position: Position): Arrow | null => {
    for (const arrow of flashcard.arrows) {
      if (CanvasUtils.isPointNearArrow(position, arrow, flashcard.sides, flashcard.arrows, 15)) {
        return arrow;
      }
    }
    return null;
  }, [flashcard.arrows, flashcard.sides]);

  const handleCanvasDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== 'select') return;

    const canvasPos = getCanvasPosition(event);
    const clickedSide = findSideAtPosition(canvasPos);
    const clickedArrow = findArrowAtPosition(canvasPos);

    if (clickedSide) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const screenPos = CanvasUtils.canvasToScreen(clickedSide.position, canvasState);
        const inputRect = new DOMRect(
          rect.left + screenPos.x,
          rect.top + screenPos.y,
          (clickedSide.width || SIDE_WIDTH),
          (clickedSide.height || SIDE_HEIGHT)
        );

        setEditing({
          sideId: clickedSide.id,
          text: clickedSide.value,
          inputRect
        });
      }
    } else if (clickedArrow) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();

        // Calculate arrow midpoint for label position
        const path = calculateArrowPath(clickedArrow);
        if (path.length >= 2) {
          const midIndex = Math.floor(path.length / 2);
          const labelPos = path[midIndex];

          const ctx = canvas.getContext('2d');
          const labelWidth = ctx && clickedArrow.label
            ? Math.max(ctx.measureText(clickedArrow.label).width + 20, 60)
            : 100;
          const labelHeight = 24;

          const inputRect = new DOMRect(
            rect.left + labelPos.x - labelWidth / 2,
            rect.top + labelPos.y - labelHeight / 2,
            labelWidth,
            labelHeight
          );

          setArrowEditing({
            arrowId: clickedArrow.id,
            text: clickedArrow.label,
            inputRect
          });
        }
      }
    }
  };

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (canvasState.isCreatingArrow) {
          onCanvasClick({ x: 0, y: 0 }); // Cancel arrow creation
        }
        if (editing.sideId) {
          setEditing({ sideId: null, text: '', inputRect: null });
        }
        if (arrowEditing.arrowId) {
          setArrowEditing({ arrowId: null, text: '', inputRect: null });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasState.isCreatingArrow, editing.sideId, arrowEditing.arrowId, onCanvasClick]);

  const getCanvasClassName = () => {
    const baseClass = 'flashcard-canvas';
    const toolClass = `tool-${selectedTool}`;
    const panningClass = isPanning ? 'panning' : '';
    return `${baseClass} ${toolClass} ${panningClass}`.trim();
  };

  return (
    <div ref={containerRef} className="flashcard-canvas-container">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onWheel={handleCanvasWheel}
        onDoubleClick={handleCanvasDoubleClick}
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click context menu
        className={getCanvasClassName()}
      />

      {editing.sideId && editing.inputRect && (
        <input
          type="text"
          value={editing.text}
          onChange={(e) => setEditing(prev => ({ ...prev, text: e.target.value }))}
          onBlur={() => {
            if (editing.sideId) {
              onSideTextUpdate(editing.sideId, editing.text);
            }
            setEditing({ sideId: null, text: '', inputRect: null });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          autoFocus
          style={{
            position: 'fixed',
            left: editing.inputRect.left,
            top: editing.inputRect.top,
            width: editing.inputRect.width,
            height: editing.inputRect.height,
            border: '2px solid #3498db',
            borderRadius: '2px',
            padding: '4px',
            fontSize: '14px',
            textAlign: 'center',
            zIndex: 1001,
            background: 'white'
          }}
        />
      )}

      {arrowEditing.arrowId && arrowEditing.inputRect && (
        <input
          type="text"
          value={arrowEditing.text}
          onChange={(e) => setArrowEditing(prev => ({ ...prev, text: e.target.value }))}
          onBlur={() => {
            if (arrowEditing.arrowId && onArrowTextUpdate) {
              onArrowTextUpdate(arrowEditing.arrowId, arrowEditing.text);
            }
            setArrowEditing({ arrowId: null, text: '', inputRect: null });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              setArrowEditing({ arrowId: null, text: '', inputRect: null });
            }
          }}
          autoFocus
          style={{
            position: 'fixed',
            left: arrowEditing.inputRect.left,
            top: arrowEditing.inputRect.top,
            width: arrowEditing.inputRect.width,
            height: arrowEditing.inputRect.height,
            border: '2px solid #3498db',
            borderRadius: '2px',
            padding: '4px',
            fontSize: '12px',
            textAlign: 'center',
            zIndex: 1001,
            background: 'white'
          }}
        />
      )}
    </div>
  );
};