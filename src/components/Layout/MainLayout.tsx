import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useCanvas } from '../../context/CanvasContext';
import { FlashcardCanvas } from '../Canvas/FlashcardCanvas';
import { CanvasToolbar } from '../Toolbar/CanvasToolbar';
import { StudyModeSelector } from '../Study/StudyModeSelector';
import { FileManager } from '../FileManager/FileManager';
import { StudyMode, FlashcardSide, Arrow, Flashcard } from '../../types';
import { TauriFileService } from '../../services/TauriFileService';

export const MainLayout: React.FC = () => {
  const { state: appState, dispatch: appDispatch } = useApp();
  const { state: canvasState, dispatch: canvasDispatch } = useCanvas();
  const [showFileManager, setShowFileManager] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const getDisplayName = () => {
    if (!appState.currentSet) return '';

    let name = '';
    if (currentFilePath) {
      // Extract filename from path (handle both Windows and Unix paths)
      const filename = currentFilePath.split(/[/\\]/).pop() || currentFilePath;
      // Remove .json extension if present
      name = filename.replace(/\.json$/, '');
    } else {
      name = appState.currentSet.name;
    }

    // Add asterisk for unsaved changes
    return hasUnsavedChanges ? `${name} *` : name;
  };

  // Track changes to detect unsaved modifications
  const checkForUnsavedChanges = useCallback(() => {
    if (!appState.currentSet) {
      setHasUnsavedChanges(false);
      return;
    }

    const currentState = JSON.stringify({
      set: appState.currentSet,
      flashcard: appState.currentFlashcard
    });

    if (lastSavedState && currentState !== lastSavedState) {
      setHasUnsavedChanges(true);

      // Schedule auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        if (currentFilePath) {
          handleAutoSave();
        }
      }, 30000); // Auto-save after 30 seconds of inactivity
    } else if (!lastSavedState) {
      // New file, mark as having changes
      setHasUnsavedChanges(true);
    }
  }, [appState.currentSet, appState.currentFlashcard, lastSavedState, currentFilePath]);

  // Save functions - declared early for use in useEffect dependencies
  const handleSave = useCallback(async () => {
    if (!appState.currentSet) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const filePath = await TauriFileService.saveFlashcardSet(appState.currentSet, currentFilePath || undefined);
      setCurrentFilePath(filePath);

      // Update saved state tracking
      const newState = JSON.stringify({
        set: appState.currentSet,
        flashcard: appState.currentFlashcard
      });
      setLastSavedState(newState);
      setHasUnsavedChanges(false);

      // Clear auto-save timeout since we just saved
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }

      console.log('Flashcard set saved successfully');
    } catch (error) {
      console.error('Error saving flashcard set:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save flashcard set');
    } finally {
      setIsSaving(false);
    }
  }, [appState.currentSet, appState.currentFlashcard, currentFilePath]);

  const handleSaveAs = useCallback(async () => {
    if (!appState.currentSet) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const filePath = await TauriFileService.saveFlashcardSet(appState.currentSet);
      setCurrentFilePath(filePath);

      // Update saved state tracking
      const newState = JSON.stringify({
        set: appState.currentSet,
        flashcard: appState.currentFlashcard
      });
      setLastSavedState(newState);
      setHasUnsavedChanges(false);

      // Clear auto-save timeout since we just saved
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }

      console.log('Flashcard set saved successfully');
    } catch (error) {
      console.error('Error saving flashcard set:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save flashcard set');
    } finally {
      setIsSaving(false);
    }
  }, [appState.currentSet, appState.currentFlashcard]);

  // Auto-save function
  const handleAutoSave = useCallback(async () => {
    if (!appState.currentSet || !currentFilePath || isSaving) return;

    try {
      await TauriFileService.saveFlashcardSet(appState.currentSet, currentFilePath);
      const newState = JSON.stringify({
        set: appState.currentSet,
        flashcard: appState.currentFlashcard
      });
      setLastSavedState(newState);
      setHasUnsavedChanges(false);
      console.log('Auto-saved successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error for auto-save failures, just log them
    }
  }, [appState.currentSet, appState.currentFlashcard, currentFilePath, isSaving]);

  // Watch for changes
  useEffect(() => {
    checkForUnsavedChanges();
  }, [checkForUnsavedChanges]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S (or Cmd+S on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (appState.currentSet) {
          handleSave();
        }
      }

      // Ctrl+Shift+S for Save As
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        if (appState.currentSet) {
          handleSaveAs();
        }
      }

      // Ctrl+O for Open
      if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        setShowFileManager(true);
      }

      // Ctrl+N for New
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        const newSet = TauriFileService.createNewSet();
        appDispatch({ type: 'SET_CURRENT_SET', payload: newSet });
        appDispatch({ type: 'SET_EDIT_MODE', payload: 'edit' });
        setCurrentFilePath(null);
        setLastSavedState(null);
        setHasUnsavedChanges(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState.currentSet, handleSave, handleSaveAs]);

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleToolSelect = (tool: string) => {
    appDispatch({ type: 'SET_SELECTED_TOOL', payload: tool as any });
    if (tool === 'add-arrow') {
      canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
    }
  };

  const handleStudyModeSelect = (mode: StudyMode) => {
    // Phase 3: Study mode implementation placeholder
    console.log('Study mode selected (not implemented yet):', mode);
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

  const handleSideDelete = (sideIds: string[]) => {
    if (!appState.currentFlashcard) return;

    // Remove the sides and all arrows connected to them
    const updatedSides = appState.currentFlashcard.sides.filter(side => !sideIds.includes(side.id));
    const updatedArrows = appState.currentFlashcard.arrows.filter(arrow =>
      !sideIds.includes(arrow.sourceId) && !sideIds.includes(arrow.destinationId)
    );

    const updatedFlashcard = {
      ...appState.currentFlashcard,
      sides: updatedSides,
      arrows: updatedArrows
    };

    updateCurrentFlashcard(updatedFlashcard);

    // Clear selection of deleted sides
    const remainingSideIds = canvasState.selectedSideIds.filter(id => !sideIds.includes(id));
    if (remainingSideIds.length !== canvasState.selectedSideIds.length) {
      canvasDispatch({ type: 'SELECT_SIDES', payload: remainingSideIds });
    }
  };

  const handleArrowDelete = (arrowIds: string[]) => {
    if (!appState.currentFlashcard) return;

    // Remove the arrows
    const updatedArrows = appState.currentFlashcard.arrows.filter(arrow => !arrowIds.includes(arrow.id));

    const updatedFlashcard = {
      ...appState.currentFlashcard,
      arrows: updatedArrows
    };

    updateCurrentFlashcard(updatedFlashcard);

    // Clear selection of deleted arrows
    const remainingArrowIds = canvasState.selectedArrowIds.filter(id => !arrowIds.includes(id));
    if (remainingArrowIds.length !== canvasState.selectedArrowIds.length) {
      canvasDispatch({ type: 'SELECT_ARROWS', payload: remainingArrowIds });
    }
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

    // Check if an arrow already exists between these two sides
    const existingArrow = appState.currentFlashcard.arrows.find(arrow =>
      arrow.sourceId === sourceId && arrow.destinationId === destinationId
    );

    if (existingArrow) {
      // Arrow already exists, just select it and start editing
      canvasDispatch({ type: 'SELECT_ARROWS', payload: [existingArrow.id] });
      setNewArrowForEditing(existingArrow.id);
      canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
      return;
    }

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
          <h2>{getDisplayName()}</h2>
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
              onSideDelete={handleSideDelete}
              onArrowCreate={handleArrowCreate}
              onArrowTextUpdate={handleArrowTextUpdate}
              onArrowSelect={handleArrowSelect}
              onArrowDelete={handleArrowDelete}
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
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="save-button"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleSaveAs}
                disabled={isSaving}
                className="save-as-button"
              >
                Save As...
              </button>
              <span className="current-set">{getDisplayName()}</span>
            </>
          )}
        </div>
      </header>

      {saveError && (
        <div className="error-banner">
          <span>Error saving file: {saveError}</span>
          <button onClick={() => setSaveError(null)}>×</button>
        </div>
      )}

      <main className="app-main">
        {renderMainContent()}
      </main>

      {showFileManager && (
        <FileManager
          onClose={() => setShowFileManager(false)}
          onFileOpened={(filePath, set) => {
            setCurrentFilePath(filePath);
            // Clear canvas selections when opening a new file
            canvasDispatch({ type: 'CLEAR_SELECTION' });
            canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
            // Set saved state when file is opened
            const state = JSON.stringify({
              set,
              flashcard: set.flashcards.length > 0 ? set.flashcards[0] : null
            });
            setLastSavedState(state);
            setHasUnsavedChanges(false);
          }}
        />
      )}

    </div>
  );
};