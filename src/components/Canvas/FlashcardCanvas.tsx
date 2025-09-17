import { useCallback, useRef, useEffect } from 'react';
import { Flashcard, CanvasState, CanvasTool, Position } from '../../types';

interface FlashcardCanvasProps {
  flashcard: Flashcard;
  canvasState: CanvasState;
  selectedTool: CanvasTool;
  onSideSelect: (sideId: string, multiSelect?: boolean) => void;
  onSideMove: (sideId: string, newPosition: Position) => void;
  onArrowCreate: (sourceId: string, destinationId: string) => void;
  onCanvasClick: (position: Position) => void;
}

export const FlashcardCanvas: React.FC<FlashcardCanvasProps> = ({
  flashcard,
  canvasState,
  selectedTool,
  onSideSelect,
  onSideMove,
  onArrowCreate,
  onCanvasClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCanvas = useCallback(() => {
    // Canvas drawing logic will be implemented here
    // - Draw grid if enabled
    // - Draw flashcard sides
    // - Draw arrows between sides
    // - Handle zoom and pan transforms
  }, [flashcard, canvasState]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Convert mouse coordinates to canvas coordinates
    // Handle tool-specific click behavior
    // - Select tool: select sides/arrows
    // - Add side tool: create new side
    // - Add arrow tool: start/complete arrow creation
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Handle drag operations
    // Update cursor based on hover state
  };

  return (
    <div className="flashcard-canvas-container">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        className="flashcard-canvas"
      />
    </div>
  );
};