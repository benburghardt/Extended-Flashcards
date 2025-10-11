// Phase 2: Tauri File Service - Implementation complete
import { FlashcardSet, FlashcardTemplate, FileMetadata } from '../types';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, stat } from '@tauri-apps/plugin-fs';

export class TauriFileService {
  private static readonly RECENT_FILES_KEY = 'extended-flashcards-recent-files';
  private static readonly MAX_RECENT_FILES = 10;

  static async openFlashcardSet(): Promise<{ set: FlashcardSet; filePath: string } | null> {
    try {
      const filePath = await open({
        title: 'Open Flashcard Set',
        filters: [{ name: 'Flashcard Sets', extensions: ['json'] }],
      });

      if (!filePath) return null;

      const content = await readTextFile(filePath as string);
      const data = JSON.parse(content);

      if (!this.validateFlashcardSet(data)) {
        throw new Error('Invalid flashcard set file format');
      }

      await this.addToRecentFiles(filePath as string, 'set');
      return { set: data, filePath: filePath as string };
    } catch (error) {
      console.error('Error opening flashcard set:', error);

      // Convert Tauri-specific errors to user-friendly messages
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('invoke') || errorMessage.includes('__TAURI__') || errorMessage.includes('not available')) {
          throw new Error('File operations are only available in the desktop app. Please run with "npm run tauri:dev" or use the built desktop application.');
        }
      }

      throw error;
    }
  }

  static async openFlashcardSetByPath(filePath: string): Promise<FlashcardSet> {
    try {
      const content = await readTextFile(filePath);
      const data = JSON.parse(content);

      if (!this.validateFlashcardSet(data)) {
        throw new Error('Invalid flashcard set file format');
      }

      await this.addToRecentFiles(filePath, 'set');
      return data;
    } catch (error) {
      console.error('Error opening flashcard set by path:', error);
      throw error;
    }
  }

  static async saveFlashcardSet(set: FlashcardSet, filePath?: string): Promise<string> {
    try {
      let targetPath = filePath;

      if (!targetPath) {
        const selectedPath = await save({
          title: 'Save Flashcard Set',
          defaultPath: `${set.name}.json`,
          filters: [{ name: 'Flashcard Sets', extensions: ['json'] }],
        });
        targetPath = selectedPath || undefined;
      }

      if (!targetPath) throw new Error('Save cancelled');

      // Update modified timestamp
      const updatedSet = {
        ...set,
        modifiedAt: new Date()
      };

      const content = JSON.stringify(updatedSet, null, 2);
      await writeTextFile(targetPath, content);

      await this.addToRecentFiles(targetPath, 'set');
      return targetPath;
    } catch (error) {
      console.error('Error saving flashcard set:', error);

      // Convert Tauri-specific errors to user-friendly messages
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('invoke') || errorMessage.includes('__TAURI__') || errorMessage.includes('not available')) {
          throw new Error('File operations are only available in the desktop app. Please run with "npm run tauri:dev" or use the built desktop application.');
        }
      }

      throw error;
    }
  }

  static async openTemplate(): Promise<FlashcardTemplate | null> {
    try {
      const filePath = await open({
        title: 'Open Flashcard Template',
        filters: [{ name: 'Flashcard Templates', extensions: ['json'] }],
      });

      if (!filePath) return null;

      const content = await readTextFile(filePath as string);
      const data = JSON.parse(content);

      if (!this.validateTemplate(data)) {
        throw new Error('Invalid template file format');
      }

      await this.addToRecentFiles(filePath as string, 'template');
      return data;
    } catch (error) {
      console.error('Error opening template:', error);
      throw error;
    }
  }

  static async saveTemplate(template: FlashcardTemplate, filePath?: string): Promise<string> {
    try {
      let targetPath = filePath;

      if (!targetPath) {
        const selectedPath = await save({
          title: 'Save Flashcard Template',
          defaultPath: `${template.name}.json`,
          filters: [{ name: 'Flashcard Templates', extensions: ['json'] }],
        });
        targetPath = selectedPath || undefined;
      }

      if (!targetPath) throw new Error('Save cancelled');

      const content = JSON.stringify(template, null, 2);
      await writeTextFile(targetPath, content);

      await this.addToRecentFiles(targetPath, 'template');
      return targetPath;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }

  static async getRecentFiles(): Promise<FileMetadata[]> {
    try {
      const recent = localStorage.getItem(this.RECENT_FILES_KEY);
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      console.error('Error getting recent files:', error);
      return [];
    }
  }

  private static async addToRecentFiles(filePath: string, type: 'set' | 'template'): Promise<void> {
    try {
      const recentFiles = await this.getRecentFiles();
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown';

      // Get file stats for size and last modified
      let fileSize = 0;
      let lastModified = new Date();
      try {
        const fileStats = await stat(filePath);
        fileSize = fileStats.size || 0;
        lastModified = fileStats.mtime || new Date();
      } catch (statError) {
        console.warn('Could not get file stats:', statError);
      }

      const newFile: FileMetadata = {
        name: fileName,
        path: filePath,
        type,
        lastModified,
        size: fileSize,
      };

      // Remove existing entry if it exists
      const filtered = recentFiles.filter(f => f.path !== filePath);

      // Add to beginning and limit to max
      const updated = [newFile, ...filtered].slice(0, this.MAX_RECENT_FILES);

      localStorage.setItem(this.RECENT_FILES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating recent files:', error);
    }
  }

  private static validateFlashcardSet(data: any): data is FlashcardSet {
    try {
      return (
        data &&
        typeof data.id === 'string' &&
        typeof data.name === 'string' &&
        Array.isArray(data.flashcards) &&
        typeof data.version === 'string' &&
        data.createdAt &&
        data.modifiedAt &&
        // Validate flashcards structure
        data.flashcards.every((card: any) =>
          card &&
          typeof card.id === 'string' &&
          Array.isArray(card.sides) &&
          Array.isArray(card.arrows) &&
          // Validate sides
          card.sides.every((side: any) =>
            side &&
            typeof side.id === 'string' &&
            typeof side.value === 'string' &&
            side.position &&
            typeof side.position.x === 'number' &&
            typeof side.position.y === 'number'
          ) &&
          // Validate arrows
          card.arrows.every((arrow: any) =>
            arrow &&
            typeof arrow.id === 'string' &&
            typeof arrow.sourceId === 'string' &&
            typeof arrow.destinationId === 'string' &&
            typeof arrow.label === 'string'
          )
        )
      );
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }

  private static validateTemplate(data: any): data is FlashcardTemplate {
    try {
      return (
        data &&
        typeof data.id === 'string' &&
        typeof data.name === 'string' &&
        Array.isArray(data.sides) &&
        Array.isArray(data.arrows) &&
        data.createdAt &&
        // Validate sides structure
        data.sides.every((side: any) =>
          side &&
          typeof side.id === 'string' &&
          typeof side.value === 'string' &&
          side.position &&
          typeof side.position.x === 'number' &&
          typeof side.position.y === 'number'
        ) &&
        // Validate arrows structure
        data.arrows.every((arrow: any) =>
          arrow &&
          typeof arrow.id === 'string' &&
          typeof arrow.sourceId === 'string' &&
          typeof arrow.destinationId === 'string' &&
          typeof arrow.label === 'string'
        )
      );
    } catch (error) {
      console.error('Template validation error:', error);
      return false;
    }
  }

  static createNewSet(name: string = 'New Flashcard Set'): FlashcardSet {
    return {
      id: this.generateId(),
      name,
      description: '',
      flashcards: [],
      version: '1.0.0',
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
  }

  // Phase 4: Template creation - not yet implemented
  static createNewTemplate(_name: string = 'New Template'): FlashcardTemplate {
    throw new Error('Template creation not implemented - Phase 4 feature');
  }

  private static generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  static async exportToCSV(_set: FlashcardSet): Promise<string> {
    // Phase 3: Implementation for CSV export
    throw new Error('Not implemented - Phase 3 feature');
  }

  static async importFromCSV(_filePath: string): Promise<FlashcardSet> {
    // Phase 3: Implementation for CSV import
    throw new Error('Not implemented - Phase 3 feature');
  }
}