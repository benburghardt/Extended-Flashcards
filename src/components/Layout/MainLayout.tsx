import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useCanvas } from '../../context/CanvasContext';
import { FlashcardCanvas } from '../Canvas/FlashcardCanvas';
import { CanvasToolbar } from '../Toolbar/CanvasToolbar';
import { StudyModeSelector } from '../Study/StudyModeSelector';
import { FileManager } from '../FileManager/FileManager';
import { StudyMode, FlashcardSide, Arrow, Flashcard } from '../../types';

export const MainLayout: React.FC = () => {
  const { state: appState, dispatch: appDispatch } = useApp();
  const { state: canvasState, dispatch: canvasDispatch } = useCanvas();
  const [showFileManager, setShowFileManager] = useState(false);

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleToolSelect = (tool: string) => {
    appDispatch({ type: 'SET_SELECTED_TOOL', payload: tool as any });
    if (tool === 'add-arrow') {
      canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
    }
  };

  const handleStudyModeSelect = (mode: StudyMode) => {
    // Implementation will create study session
    console.log('Selected study mode:', mode);
  };

  const handleSideSelect = (sideId: string, multiSelect?: boolean) => {
    if (appState.selectedTool === 'add-arrow') {
      if (!canvasState.isCreatingArrow) {
        canvasDispatch({ type: 'START_ARROW_CREATION', payload: sideId });
      }
      return;
    }

    if (sideId === '') {
      canvasDispatch({ type: 'CLEAR_SELECTION' });
      return;
    }

    if (multiSelect && canvasState.selectedSideIds.includes(sideId)) {
      canvasDispatch({
        type: 'SELECT_SIDES',
        payload: canvasState.selectedSideIds.filter(id => id !== sideId)
      });
    } else if (multiSelect) {
      canvasDispatch({
        type: 'SELECT_SIDES',
        payload: [...canvasState.selectedSideIds, sideId]
      });
    } else {
      canvasDispatch({
        type: 'SELECT_SIDES',
        payload: [sideId]
      });
    }
  };

  const updateCurrentFlashcard = (updatedFlashcard: Flashcard) => {
    if (!appState.currentSet) return;

    const updatedSet = {
      ...appState.currentSet,
      flashcards: appState.currentSet.flashcards.map(card =>
        card.id === updatedFlashcard.id ? updatedFlashcard : card
      ),
      modifiedAt: new Date()
    };

    appDispatch({ type: 'SET_CURRENT_SET', payload: updatedSet });
    appDispatch({ type: 'UPDATE_FLASHCARD', payload: updatedFlashcard });
  };

  const handleSideMove = (sideId: string, newPosition: { x: number; y: number }) => {
    if (!appState.currentFlashcard) return;

    const updatedSides = appState.currentFlashcard.sides.map(side =>
      side.id === sideId ? { ...side, position: newPosition } : side
    );

    const updatedFlashcard = {
      ...appState.currentFlashcard,
      sides: updatedSides,
      modifiedAt: new Date()
    };

    updateCurrentFlashcard(updatedFlashcard);
  };

  const handleSideTextUpdate = (sideId: string, newText: string) => {
    if (!appState.currentFlashcard) return;

    const updatedSides = appState.currentFlashcard.sides.map(side =>
      side.id === sideId ? { ...side, value: newText } : side
    );

    const updatedFlashcard = {
      ...appState.currentFlashcard,
      sides: updatedSides,
      modifiedAt: new Date()
    };

    updateCurrentFlashcard(updatedFlashcard);
  };

  const handleArrowCreate = (sourceId: string, destinationId: string) => {
    if (!appState.currentFlashcard) return;

    // Create arrow immediately with empty label
    const newArrow: Arrow = {
      id: generateId(),
      sourceId,
      destinationId,
      label: '', // Start with empty label
      color: '#6c757d'
    };

    const updatedFlashcard = {
      ...appState.currentFlashcard,
      arrows: [...appState.currentFlashcard.arrows, newArrow],
      modifiedAt: new Date()
    };

    updateCurrentFlashcard(updatedFlashcard);

    // Trigger inline editing for the new arrow
    setNewArrowForEditing(newArrow.id);
    canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
  };

  const handleArrowTextUpdate = (arrowId: string, newText: string) => {
    if (!appState.currentFlashcard) return;

    const updatedArrows = appState.currentFlashcard.arrows.map(arrow =>
      arrow.id === arrowId ? { ...arrow, label: newText } : arrow
    );

    const updatedFlashcard = {
      ...appState.currentFlashcard,
      arrows: updatedArrows,
      modifiedAt: new Date()
    };

    updateCurrentFlashcard(updatedFlashcard);
  };

  const handleArrowSelect = (arrowId: string, multiSelect?: boolean) => {
    if (arrowId === '') {
      canvasDispatch({ type: 'CLEAR_SELECTION' });
      return;
    }

    if (multiSelect && canvasState.selectedArrowIds.includes(arrowId)) {
      canvasDispatch({
        type: 'SELECT_ARROWS',
        payload: canvasState.selectedArrowIds.filter(id => id !== arrowId)
      });
    } else if (multiSelect) {
      canvasDispatch({
        type: 'SELECT_ARROWS',
        payload: [...canvasState.selectedArrowIds, arrowId]
      });
    } else {
      canvasDispatch({
        type: 'SELECT_ARROWS',
        payload: [arrowId]
      });
    }
  };

  const [newSideForEditing, setNewSideForEditing] = useState<string | null>(null);
  const [newArrowForEditing, setNewArrowForEditing] = useState<string | null>(null);

  const handleCanvasClick = (position: { x: number; y: number }) => {
    if (appState.selectedTool === 'add-side') {
      if (!appState.currentFlashcard) return;

      const newSide: FlashcardSide = {
        id: generateId(),
        value: '',
        position,
        width: 120,
        height: 80,
        color: '#ffffff',
        fontSize: 14
      };

      const updatedFlashcard = {
        ...appState.currentFlashcard,
        sides: [...appState.currentFlashcard.sides, newSide],
        modifiedAt: new Date()
      };

      updateCurrentFlashcard(updatedFlashcard);

      // Auto-select the new side for immediate editing
      canvasDispatch({ type: 'SELECT_SIDES', payload: [newSide.id] });

      // Trigger immediate text editing
      setNewSideForEditing(newSide.id);
    } else if (appState.selectedTool === 'add-arrow') {
      // Cancel arrow creation
      canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
    }
  };

  const handleCreateFlashcard = () => {
    if (!appState.currentSet) return;

    const newFlashcard: Flashcard = {
      id: generateId(),
      name: `Card ${appState.currentSet.flashcards.length + 1}`,
      sides: [],
      arrows: [],
      createdAt: new Date(),
      modifiedAt: new Date()
    };

    const updatedSet = {
      ...appState.currentSet,
      flashcards: [...appState.currentSet.flashcards, newFlashcard],
      modifiedAt: new Date()
    };

    appDispatch({ type: 'SET_CURRENT_SET', payload: updatedSet });
    appDispatch({ type: 'SET_CURRENT_FLASHCARD', payload: newFlashcard });
    appDispatch({ type: 'SET_EDIT_MODE', payload: 'edit' });
  };

  const renderMainContent = () => {
    console.log('Rendering main content:', {
      editMode: appState.editMode,
      hasCurrentSet: !!appState.currentSet,
      hasCurrentFlashcard: !!appState.currentFlashcard,
      flashcardCount: appState.currentSet?.flashcards?.length || 0
    });

    if (appState.editMode === 'study' && appState.studySession) {
      return (
        <div className="study-interface">
          <h2>Study Session</h2>
          {/* Study interface will be implemented */}
          <p>Study mode: {appState.studySession.mode}</p>
        </div>
      );
    }

    if (!appState.currentSet) {
      return (
        <div className="welcome-screen">
          <h2>Welcome to Extended Flashcards</h2>
          <p>Create a new flashcard set or open an existing one to get started.</p>
          <button onClick={() => setShowFileManager(true)}>
            Open File Manager
          </button>
        </div>
      );
    }

    if (!appState.currentFlashcard && appState.currentSet.flashcards.length === 0) {
      return (
        <div className="empty-set">
          <h2>{appState.currentSet.name}</h2>
          <p>This set is empty. Create your first flashcard to get started.</p>
          <button onClick={handleCreateFlashcard}>
            Create First Flashcard
          </button>
        </div>
      );
    }

    return (
      <div className="editor-interface">
        <div className="toolbar-container">
          <CanvasToolbar
            selectedTool={appState.selectedTool}
            onToolSelect={handleToolSelect}
            onUndo={() => console.log('Undo')}
            onRedo={() => console.log('Redo')}
            onZoomIn={() => canvasDispatch({ type: 'SET_ZOOM', payload: Math.min(5, canvasState.zoom + 0.2) })}
            onZoomOut={() => canvasDispatch({ type: 'SET_ZOOM', payload: Math.max(0.1, canvasState.zoom - 0.2) })}
            onZoomReset={() => {
              canvasDispatch({ type: 'SET_ZOOM', payload: 1 });
              canvasDispatch({ type: 'SET_PAN_OFFSET', payload: { x: 0, y: 0 } });
            }}
            canUndo={false}
            canRedo={false}
          />
        </div>

        <div className="canvas-container">
          {appState.currentFlashcard && (
            <FlashcardCanvas
              flashcard={appState.currentFlashcard}
              canvasState={canvasState}
              selectedTool={appState.selectedTool}
              onSideSelect={handleSideSelect}
              onSideMove={handleSideMove}
              onSideTextUpdate={handleSideTextUpdate}
              onArrowCreate={handleArrowCreate}
              onArrowTextUpdate={handleArrowTextUpdate}
              onArrowSelect={handleArrowSelect}
              onCanvasClick={handleCanvasClick}
              onZoomChange={(newZoom) => canvasDispatch({ type: 'SET_ZOOM', payload: newZoom })}
              onPanChange={(newOffset) => canvasDispatch({ type: 'SET_PAN_OFFSET', payload: newOffset })}
              newSideForEditing={newSideForEditing}
              newArrowForEditing={newArrowForEditing}
              onEditingComplete={() => {
                setNewSideForEditing(null);
                setNewArrowForEditing(null);
              }}
            />
          )}
        </div>

        <div className="side-panel">
          <StudyModeSelector
            selectedMode="self-test"
            onModeSelect={handleStudyModeSelect}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="main-layout">
      <header className="app-header">
        <h1>Extended Flashcards</h1>
        <div className="header-actions">
          <button onClick={() => setShowFileManager(true)}>
            File Manager
          </button>
          {appState.currentSet && (
            <span className="current-set">{appState.currentSet.name}</span>
          )}
        </div>
      </header>

      <main className="app-main">
        {renderMainContent()}
      </main>

      {showFileManager && (
        <FileManager onClose={() => setShowFileManager(false)} />
      )}

    </div>
  );
};