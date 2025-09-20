// Phase 2: Tauri File Service - Framework ready for implementation
import { FlashcardSet, FlashcardTemplate, FileMetadata } from '../types';

// Tauri API imports will be added when implementing
// import { open, save } from '@tauri-apps/api/dialog';
// import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';

export class TauriFileService {
  private static readonly RECENT_FILES_KEY = 'extended-flashcards-recent-files';
  private static readonly MAX_RECENT_FILES = 10;

  static async openFlashcardSet(): Promise<FlashcardSet | null> {
    try {
      // const filePath = await open({
      //   title: 'Open Flashcard Set',
      //   filters: [{ name: 'Flashcard Sets', extensions: ['json'] }],
      // });

      // if (!filePath) return null;

      // const content = await readTextFile(filePath as string);
      // const data = JSON.parse(content);

      // if (!this.validateFlashcardSet(data)) {
      //   throw new Error('Invalid flashcard set file format');
      // }

      // await this.addToRecentFiles(filePath as string, 'set');
      // return data;

      // Placeholder implementation
      throw new Error('Not implemented - requires Tauri APIs');
    } catch (error) {
      console.error('Error opening flashcard set:', error);
      throw error;
    }
  }

  static async saveFlashcardSet(set: FlashcardSet, filePath?: string): Promise<string> {
    try {
      // let targetPath = filePath;

      // if (!targetPath) {
      //   targetPath = await save({
      //     title: 'Save Flashcard Set',
      //     defaultPath: `${set.name}.json`,
      //     filters: [{ name: 'Flashcard Sets', extensions: ['json'] }],
      //   });
      // }

      // if (!targetPath) throw new Error('Save cancelled');

      // const content = JSON.stringify(set, null, 2);
      // await writeTextFile(targetPath, content);

      // await this.addToRecentFiles(targetPath, 'set');
      // return targetPath;

      // Placeholder implementation
      throw new Error('Not implemented - requires Tauri APIs');
    } catch (error) {
      console.error('Error saving flashcard set:', error);
      throw error;
    }
  }

  static async openTemplate(): Promise<FlashcardTemplate | null> {
    try {
      // Similar implementation to openFlashcardSet but for templates
      throw new Error('Not implemented - requires Tauri APIs');
    } catch (error) {
      console.error('Error opening template:', error);
      throw error;
    }
  }

  static async saveTemplate(template: FlashcardTemplate, filePath?: string): Promise<string> {
    try {
      // Similar implementation to saveFlashcardSet but for templates
      throw new Error('Not implemented - requires Tauri APIs');
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

      const newFile: FileMetadata = {
        name: fileName,
        path: filePath,
        type,
        lastModified: new Date(),
        size: 0, // Will be updated when we have file stats
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
    return (
      data &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      Array.isArray(data.flashcards) &&
      typeof data.version === 'string' &&
      data.createdAt &&
      data.modifiedAt
    );
  }

  private static validateTemplate(data: any): data is FlashcardTemplate {
    return (
      data &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      Array.isArray(data.sides) &&
      Array.isArray(data.arrows) &&
      data.createdAt
    );
  }

  static async exportToCSV(set: FlashcardSet): Promise<string> {
    // Implementation for CSV export
    throw new Error('Not implemented');
  }

  static async importFromCSV(filePath: string): Promise<FlashcardSet> {
    // Implementation for CSV import
    throw new Error('Not implemented');
  }
}