# Extended Flashcards - Development Plan & Framework

## Project Structure Overview

### Core Architecture
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Tauri 2.x (Rust)
- **State Management**: React Context API + Reducers
- **Canvas**: HTML5 Canvas API
- **File I/O**: Tauri filesystem APIs
- **Storage**: Local JSON files

### File Structure Created
```
src/
├── types/
│   └── index.ts                 # Core TypeScript interfaces
├── context/
│   ├── AppContext.tsx          # Global app state management
│   └── CanvasContext.tsx       # Canvas-specific state
├── components/
│   ├── Canvas/
│   │   └── FlashcardCanvas.tsx # Main canvas component
│   ├── Study/
│   │   └── StudyModeSelector.tsx
│   ├── Toolbar/
│   │   └── CanvasToolbar.tsx
│   ├── Layout/
│   │   └── MainLayout.tsx      # Main app layout
│   └── FileManager/
│       └── FileManager.tsx     # File operations UI
├── services/
│   └── TauriFileService.ts     # Tauri file operations
├── algorithms/
│   ├── spacedRepetition.ts     # SM-2 algorithm
│   └── studyModes.ts          # Study question generation
└── utils/
    ├── fileOperations.ts       # File utility functions
    └── canvasUtils.ts         # Canvas helper functions
```

## Implementation Priority & Feature Roadmap

### Phase 1: Core Foundation (NEXT STEPS)
1. **Canvas Implementation**
   - Complete FlashcardCanvas drawing logic
   - Implement side rendering and interaction
   - Add arrow drawing and creation workflow
   - Implement drag-and-drop for sides

2. **Basic Flashcard Management**
   - Create flashcard creation UI
   - Implement side addition/removal
   - Add arrow creation with labeling
   - Basic save/load functionality

### Phase 2: File System Integration
1. **Tauri File APIs**
   - Implement actual file operations in TauriFileService
   - Add proper error handling and validation
   - Implement import/export functionality

2. **Data Persistence**
   - Local storage for app preferences
   - Recent files management
   - Auto-save functionality

### Phase 3: Study System
1. **Study Mode Implementation**
   - Self-test mode with input validation
   - Multiple choice generation
   - Progress tracking and statistics

2. **Spaced Repetition**
   - Complete SM-2 algorithm integration
   - Schedule management
   - Performance analytics

### Phase 4: Advanced Features
1. **Canvas Enhancements**
   - Grid snapping and alignment tools
   - Zoom and pan improvements
   - Undo/redo system

2. **Template System**
   - Template creation and management
   - Template application to new flashcards
   - Template sharing

### Phase 5: Polish & Optimization
1. **UI/UX Improvements**
   - Better styling and animations
   - Keyboard shortcuts
   - Accessibility features

2. **Performance**
   - Canvas optimization for large flashcards
   - Memory management
   - File loading optimization

## Technical Decisions Made

### State Management Strategy
- **App-level state**: Current set, flashcard, edit mode, study session
- **Canvas state**: Zoom, pan, selections, tool state
- **Local state**: Component-specific UI state

### Canvas Implementation Approach
- HTML5 Canvas for performance with complex graphics
- Tool-based interaction model (select → click workflow)
- Coordinate transformation for zoom/pan
- Grid snapping with optional toggle

### File Format Strategy
- JSON for human-readable, version-controllable files
- Separate file types for sets vs templates
- Metadata embedded in files for validation

### Study Algorithm Design
- Pluggable algorithm system (SM-2 as default)
- Arrow-based testing (not card-based)
- Fuzzy matching for answer validation
- Configurable difficulty calculation

## Development Guidelines

### Code Organization
- Strict TypeScript interfaces for all data
- React functional components with hooks
- Centralized state management
- Utility functions for reusable logic

### Testing Strategy (Future)
- Unit tests for algorithms and utilities
- Integration tests for file operations
- E2E tests for critical user workflows

### Performance Considerations
- Canvas rendering optimization
- Lazy loading for large datasets
- Efficient arrow collision detection
- Memory management for large flashcard sets

## Known Limitations & Future Enhancements

### Current Limitations
- File operations not yet implemented (need Tauri APIs)
- Canvas drawing is placeholder implementation
- No media support (text-only initially)
- No real-time collaboration

### Planned Enhancements
- Rich text formatting support
- Image/audio/video integration
- Advanced search and filtering
- Cross-flashcard relationships
- Export to various formats (PDF, Anki, etc.)

## Getting Started with Development

### Immediate Next Steps
1. Complete the FlashcardCanvas implementation
2. Add CSS styling for all components
3. Implement Tauri file operations
4. Create sample flashcard sets for testing
5. Add basic error handling throughout

### Development Commands
```bash
npm run dev          # Start development server
npm run tauri:dev    # Start Tauri development
npm run build        # Build for production
npm run tauri:build  # Build Tauri app
```

This framework provides a solid foundation for implementing all features specified in the project requirements while maintaining code quality and extensibility.