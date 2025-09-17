import { FlashcardSet, FlashcardTemplate, FileMetadata } from '../types';

// Tauri file system operations will be implemented here
export class FileOperations {
  static async saveFlashcardSet(set: FlashcardSet, filePath?: string): Promise<string> {
    // Use Tauri's file system API to save JSON
    // Return the file path where it was saved
    throw new Error('Not implemented yet');
  }

  static async loadFlashcardSet(filePath: string): Promise<FlashcardSet> {
    // Use Tauri's file system API to load and parse JSON
    throw new Error('Not implemented yet');
  }

  static async saveTemplate(template: FlashcardTemplate, filePath?: string): Promise<string> {
    // Save template as JSON file
    throw new Error('Not implemented yet');
  }

  static async loadTemplate(filePath: string): Promise<FlashcardTemplate> {
    // Load and parse template JSON file
    throw new Error('Not implemented yet');
  }

  static async listRecentFiles(): Promise<FileMetadata[]> {
    // Return list of recently opened files with metadata
    throw new Error('Not implemented yet');
  }

  static async exportSet(set: FlashcardSet, format: 'json' | 'csv'): Promise<string> {
    // Export set in specified format
    throw new Error('Not implemented yet');
  }

  static async importSet(filePath: string): Promise<FlashcardSet> {
    // Import set from various formats
    throw new Error('Not implemented yet');
  }

  static validateSetFile(data: any): data is FlashcardSet {
    // Validate that loaded data matches FlashcardSet structure
    return (
      data &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      Array.isArray(data.flashcards) &&
      typeof data.version === 'string'
    );
  }

  static validateTemplateFile(data: any): data is FlashcardTemplate {
    // Validate that loaded data matches FlashcardTemplate structure
    return (
      data &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      Array.isArray(data.sides) &&
      Array.isArray(data.arrows)
    );
  }
}