import { Position, FlashcardSide, Arrow, CanvasState } from '../types';

export class CanvasUtils {
  static screenToCanvas(
    screenPos: Position,
    canvasState: CanvasState,
    canvasElement: HTMLCanvasElement
  ): Position {
    const rect = canvasElement.getBoundingClientRect();
    return {
      x: (screenPos.x - rect.left - canvasState.panOffset.x) / canvasState.zoom,
      y: (screenPos.y - rect.top - canvasState.panOffset.y) / canvasState.zoom,
    };
  }

  static canvasToScreen(
    canvasPos: Position,
    canvasState: CanvasState
  ): Position {
    return {
      x: canvasPos.x * canvasState.zoom + canvasState.panOffset.x,
      y: canvasPos.y * canvasState.zoom + canvasState.panOffset.y,
    };
  }

  static snapToGrid(position: Position, gridSize: number): Position {
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
    };
  }

  static isPointInSide(point: Position, side: FlashcardSide): boolean {
    const width = side.width || 100;
    const height = side.height || 60;

    return (
      point.x >= side.position.x &&
      point.x <= side.position.x + width &&
      point.y >= side.position.y &&
      point.y <= side.position.y + height
    );
  }

  static isPointNearArrow(
    point: Position,
    arrow: Arrow,
    sides: FlashcardSide[],
    tolerance: number = 5
  ): boolean {
    const sourceCenter = this.getSideCenter(sides.find(s => s.id === arrow.sourceId)!);
    const destCenter = this.getSideCenter(sides.find(s => s.id === arrow.destinationId)!);

    return this.distanceToLineSegment(point, sourceCenter, destCenter) <= tolerance;
  }

  static getSideCenter(side: FlashcardSide): Position {
    const width = side.width || 100;
    const height = side.height || 60;

    return {
      x: side.position.x + width / 2,
      y: side.position.y + height / 2,
    };
  }

  private static distanceToLineSegment(
    point: Position,
    lineStart: Position,
    lineEnd: Position
  ): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    const xx = lineStart.x + param * C;
    const yy = lineStart.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }

  static calculateArrowPath(
    sourceCenter: Position,
    destCenter: Position
  ): { path: Position[], arrowHead: Position[] } {
    const dx = destCenter.x - sourceCenter.x;
    const dy = destCenter.y - sourceCenter.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      return { path: [sourceCenter, destCenter], arrowHead: [] };
    }

    const unitX = dx / length;
    const unitY = dy / length;

    // Arrow head size
    const headLength = 15;
    const headAngle = Math.PI / 6;

    // Calculate arrow head points
    const headX1 = destCenter.x - headLength * Math.cos(Math.atan2(dy, dx) - headAngle);
    const headY1 = destCenter.y - headLength * Math.sin(Math.atan2(dy, dx) - headAngle);
    const headX2 = destCenter.x - headLength * Math.cos(Math.atan2(dy, dx) + headAngle);
    const headY2 = destCenter.y - headLength * Math.sin(Math.atan2(dy, dx) + headAngle);

    return {
      path: [sourceCenter, destCenter],
      arrowHead: [
        { x: headX1, y: headY1 },
        destCenter,
        { x: headX2, y: headY2 },
      ],
    };
  }

  static drawGrid(
    ctx: CanvasRenderingContext2D,
    canvasState: CanvasState,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (!canvasState.gridSnapEnabled) return;

    ctx.save();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    const gridSize = canvasState.gridSize * canvasState.zoom;
    const offsetX = canvasState.panOffset.x % gridSize;
    const offsetY = canvasState.panOffset.y % gridSize;

    ctx.beginPath();
    for (let x = offsetX; x < canvasWidth; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
    }
    for (let y = offsetY; y < canvasHeight; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}