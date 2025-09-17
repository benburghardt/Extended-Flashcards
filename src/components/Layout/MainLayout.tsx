import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useCanvas } from '../../context/CanvasContext';
import { FlashcardCanvas } from '../Canvas/FlashcardCanvas';
import { CanvasToolbar } from '../Toolbar/CanvasToolbar';
import { StudyModeSelector } from '../Study/StudyModeSelector';
import { FileManager } from '../FileManager/FileManager';
import { StudyMode } from '../../types';

export const MainLayout: React.FC = () => {
  const { state: appState, dispatch: appDispatch } = useApp();
  const { state: canvasState, dispatch: canvasDispatch } = useCanvas();
  const [showFileManager, setShowFileManager] = useState(false);

  const handleToolSelect = (tool: string) => {
    appDispatch({ type: 'SET_SELECTED_TOOL', payload: tool as any });
  };

  const handleStudyModeSelect = (mode: StudyMode) => {
    // Implementation will create study session
    console.log('Selected study mode:', mode);
  };

  const handleSideSelect = (sideId: string, multiSelect?: boolean) => {
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

  const handleSideMove = (sideId: string, newPosition: { x: number; y: number }) => {
    // Implementation will update flashcard side position
    console.log('Move side:', sideId, 'to:', newPosition);
  };

  const handleArrowCreate = (sourceId: string, destinationId: string) => {
    // Implementation will create new arrow
    console.log('Create arrow from:', sourceId, 'to:', destinationId);
    canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
  };

  const handleCanvasClick = (position: { x: number; y: number }) => {
    if (appState.selectedTool === 'add-side') {
      // Implementation will add new side at position
      console.log('Add side at:', position);
    } else if (appState.selectedTool === 'add-arrow' && !canvasState.isCreatingArrow) {
      // Click on empty space cancels arrow creation
      canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
    }
  };

  const renderMainContent = () => {
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
          <button onClick={() => console.log('Create flashcard')}>
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
            onZoomIn={() => canvasDispatch({ type: 'SET_ZOOM', payload: canvasState.zoom + 0.1 })}
            onZoomOut={() => canvasDispatch({ type: 'SET_ZOOM', payload: canvasState.zoom - 0.1 })}
            onZoomReset={() => canvasDispatch({ type: 'SET_ZOOM', payload: 1 })}
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
              onArrowCreate={handleArrowCreate}
              onCanvasClick={handleCanvasClick}
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