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
    allArrows: Arrow[],
    tolerance: number = 10
  ): boolean {
    // Get the advanced arrow path
    const pathPoints = this.calculateAdvancedArrowPath(arrow, allArrows, sides);

    if (pathPoints.length < 2) return false;

    // Check distance to each line segment in the path
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const distance = this.distanceToLineSegment(point, pathPoints[i], pathPoints[i + 1]);
      if (distance <= tolerance) {
        return true;
      }
    }

    return false;
  }

  static getSideCenter(side: FlashcardSide): Position {
    const width = side.width || 100;
    const height = side.height || 60;

    return {
      x: side.position.x + width / 2,
      y: side.position.y + height / 2,
    };
  }

  static determineEdgeFromVector(fromSide: FlashcardSide, toSide: FlashcardSide): 'top' | 'bottom' | 'left' | 'right' {
    const fromCenter = this.getSideCenter(fromSide);
    const toCenter = this.getSideCenter(toSide);

    const fromWidth = fromSide.width || 100;
    const fromHeight = fromSide.height || 60;

    // Vector from source center to destination center
    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;

    // Calculate intersection points with each edge
    const edges = {
      right: { distance: Infinity, edge: 'right' as const },
      left: { distance: Infinity, edge: 'left' as const },
      bottom: { distance: Infinity, edge: 'bottom' as const },
      top: { distance: Infinity, edge: 'top' as const }
    };

    // Right edge intersection
    if (dx > 0) {
      const t = (fromWidth / 2) / dx;
      const intersectY = fromCenter.y + dy * t;
      if (intersectY >= fromSide.position.y && intersectY <= fromSide.position.y + fromHeight) {
        edges.right.distance = Math.sqrt((fromWidth / 2) ** 2 + (dy * t) ** 2);
      }
    }

    // Left edge intersection
    if (dx < 0) {
      const t = (-fromWidth / 2) / dx;
      const intersectY = fromCenter.y + dy * t;
      if (intersectY >= fromSide.position.y && intersectY <= fromSide.position.y + fromHeight) {
        edges.left.distance = Math.sqrt((fromWidth / 2) ** 2 + (dy * t) ** 2);
      }
    }

    // Bottom edge intersection
    if (dy > 0) {
      const t = (fromHeight / 2) / dy;
      const intersectX = fromCenter.x + dx * t;
      if (intersectX >= fromSide.position.x && intersectX <= fromSide.position.x + fromWidth) {
        edges.bottom.distance = Math.sqrt((dx * t) ** 2 + (fromHeight / 2) ** 2);
      }
    }

    // Top edge intersection
    if (dy < 0) {
      const t = (-fromHeight / 2) / dy;
      const intersectX = fromCenter.x + dx * t;
      if (intersectX >= fromSide.position.x && intersectX <= fromSide.position.x + fromWidth) {
        edges.top.distance = Math.sqrt((dx * t) ** 2 + (fromHeight / 2) ** 2);
      }
    }

    // Find the edge with the shortest distance (where vector exits)
    let closestEdge = 'right';
    let minDistance = Infinity;

    Object.values(edges).forEach(({ distance, edge }) => {
      if (distance < minDistance) {
        minDistance = distance;
        closestEdge = edge;
      }
    });

    return closestEdge as 'top' | 'bottom' | 'left' | 'right';
  }

  static getSideEdgePoint(fromSide: FlashcardSide, toSide: FlashcardSide): Position {
    const fromCenter = this.getSideCenter(fromSide);
    const toCenter = this.getSideCenter(toSide);

    const fromWidth = fromSide.width || 100;
    const fromHeight = fromSide.height || 60;

    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;

    // Calculate distances to each edge
    const distanceToRight = Math.abs(dx > 0 ? dx : Infinity);
    const distanceToLeft = Math.abs(dx < 0 ? dx : Infinity);
    const distanceToBottom = Math.abs(dy > 0 ? dy : Infinity);
    const distanceToTop = Math.abs(dy < 0 ? dy : Infinity);

    // Find the edge with the shortest perpendicular path
    const minDistance = Math.min(distanceToRight, distanceToLeft, distanceToBottom, distanceToTop);

    if (minDistance === distanceToRight) {
      // Connect from right edge
      return {
        x: fromSide.position.x + fromWidth,
        y: fromCenter.y
      };
    } else if (minDistance === distanceToLeft) {
      // Connect from left edge
      return {
        x: fromSide.position.x,
        y: fromCenter.y
      };
    } else if (minDistance === distanceToBottom) {
      // Connect from bottom edge
      return {
        x: fromCenter.x,
        y: fromSide.position.y + fromHeight
      };
    } else {
      // Connect from top edge
      return {
        x: fromCenter.x,
        y: fromSide.position.y
      };
    }
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

  static calculateAdvancedArrowPath(
    arrow: Arrow,
    allArrows: Arrow[],
    sides: FlashcardSide[]
  ): Position[] {
    const sourceSide = sides.find(s => s.id === arrow.sourceId);
    const destSide = sides.find(s => s.id === arrow.destinationId);

    if (!sourceSide || !destSide) return [];

    // Determine which edges the arrow exits and enters
    const sourceEdge = this.determineEdgeFromVector(sourceSide, destSide);
    const destEdge = this.determineEdgeFromVector(destSide, sourceSide);

    // Get connection points from each side
    const sourcePoint = this.getSideEdgeConnectionPoint(sourceSide, sourceEdge, arrow, allArrows, sides);
    const destPoint = this.getSideEdgeConnectionPoint(destSide, destEdge, arrow, allArrows, sides);

    // Calculate path with required travel distance
    const path = this.calculateArrowPathWithTravel(sourcePoint, destPoint, sourceEdge, destEdge, sourceSide, destSide);

    return path;
  }

  static getSideEdgeConnectionPoint(
    side: FlashcardSide,
    edge: 'top' | 'bottom' | 'left' | 'right',
    currentArrow: Arrow,
    allArrows: Arrow[],
    sides: FlashcardSide[]
  ): Position {
    // Get all arrows that connect to this edge of this side (both inbound and outbound)
    const edgeArrows = allArrows.filter(arrow => {
      const sourceSide = sides.find(s => s.id === arrow.sourceId);
      const destSide = sides.find(s => s.id === arrow.destinationId);

      if (!sourceSide || !destSide) return false;

      // Check if this arrow uses this edge as source (outbound from this side)
      if (sourceSide.id === side.id) {
        return this.determineEdgeFromVector(sourceSide, destSide) === edge;
      }

      // Check if this arrow uses this edge as destination (inbound to this side)
      if (destSide.id === side.id) {
        // For inbound arrows, we need to determine which edge of the destination they connect to
        // This is the opposite edge from where they exit the source
        return this.determineEdgeFromVector(destSide, sourceSide) === edge;
      }

      return false;
    });

    // Sort all arrows on this edge by the position of their "other end"
    const sortedEdgeArrows = edgeArrows.sort((a, b) => {
      // For each arrow, find the "other side" (the side it connects to that's not the current side)
      const aOtherSide = a.sourceId === side.id
        ? sides.find(s => s.id === a.destinationId)
        : sides.find(s => s.id === a.sourceId);

      const bOtherSide = b.sourceId === side.id
        ? sides.find(s => s.id === b.destinationId)
        : sides.find(s => s.id === b.sourceId);

      if (!aOtherSide || !bOtherSide) return 0;

      const aCenter = this.getSideCenter(aOtherSide);
      const bCenter = this.getSideCenter(bOtherSide);

      if (edge === 'top' || edge === 'bottom') {
        // Horizontal edge: sort by X coordinate of the other side
        const xDiff = bCenter.x - aCenter.x;
        if (Math.abs(xDiff) > 5) return xDiff; // 5px tolerance
        return Math.abs(aCenter.y) - Math.abs(bCenter.y);
      } else {
        // Vertical edge: sort by Y coordinate of the other side
        const yDiff = bCenter.y - aCenter.y;
        if (Math.abs(yDiff) > 5) return yDiff; // 5px tolerance
        return Math.abs(aCenter.x) - Math.abs(bCenter.x);
      }
    });

    // Find the position of the current arrow in the sorted list
    const arrowIndex = sortedEdgeArrows.findIndex(a => a.id === currentArrow.id);
    const totalArrows = sortedEdgeArrows.length;

    // Calculate the connection point on this edge
    return this.getArrowEdgePoint(side, edge, arrowIndex, totalArrows);
  }


  static getArrowEdgePoint(
    side: FlashcardSide,
    edge: 'top' | 'bottom' | 'left' | 'right',
    arrowIndex: number,
    totalArrows: number
  ): Position {
    const width = side.width || 100;
    const height = side.height || 60;

    // Distribute arrows in the middle 80% of the edge
    const distribution = totalArrows > 1 ? (arrowIndex / (totalArrows - 1)) : 0.5;
    const adjustedDistribution = 0.1 + distribution * 0.8; // Map to 10%-90% of edge

    switch (edge) {
      case 'top':
        return {
          x: side.position.x + width * adjustedDistribution,
          y: side.position.y
        };
      case 'bottom':
        // Bottom edge: right-to-left placement
        return {
          x: side.position.x + width * (1 - adjustedDistribution),
          y: side.position.y + height
        };
      case 'left':
        return {
          x: side.position.x,
          y: side.position.y + height * adjustedDistribution
        };
      case 'right':
        // Right edge: bottom-to-top placement
        return {
          x: side.position.x + width,
          y: side.position.y + height * (1 - adjustedDistribution)
        };
      default:
        return this.getSideCenter(side);
    }
  }

  static calculateArrowPathWithTravel(
    sourcePoint: Position,
    destPoint: Position,
    sourceEdge: 'top' | 'bottom' | 'left' | 'right',
    destEdge: 'top' | 'bottom' | 'left' | 'right',
    sourceSide: FlashcardSide,
    destSide: FlashcardSide
  ): Position[] {
    const dx = destPoint.x - sourcePoint.x;
    const dy = destPoint.y - sourcePoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Minimum travel distance: 20% of total distance or 40 pixels, whichever is larger
    const minTravel = Math.max(distance * 0.2, 40);

    let firstCorner: Position;
    let secondCorner: Position;

    // Determine path based on source edge
    if (sourceEdge === 'left' || sourceEdge === 'right') {
      // Horizontal travel first
      const travelX = sourceEdge === 'right' ? minTravel : -minTravel;
      firstCorner = {
        x: sourcePoint.x + travelX,
        y: sourcePoint.y
      };

      // Then vertical to align with destination
      secondCorner = {
        x: firstCorner.x,
        y: destPoint.y
      };
    } else {
      // Vertical travel first
      const travelY = sourceEdge === 'bottom' ? minTravel : -minTravel;
      firstCorner = {
        x: sourcePoint.x,
        y: sourcePoint.y + travelY
      };

      // Then horizontal to align with destination
      secondCorner = {
        x: destPoint.x,
        y: firstCorner.y
      };
    }

    return [sourcePoint, firstCorner, secondCorner, destPoint];
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