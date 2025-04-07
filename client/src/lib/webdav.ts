import { createClient, WebDAVClient } from 'webdav';

class WebDAVStorage {
  private client: WebDAVClient | null = null;
  private isInitialized: boolean = false;

  async init(url: string, username?: string, password?: string): Promise<void> {
    try {
      this.client = createClient(url, {
        username,
        password,
      });
      
      // Test the connection by trying to get directory contents
      await this.client.getDirectoryContents('/');
      this.isInitialized = true;
    } catch (error) {
      this.client = null;
      this.isInitialized = false;
      throw error;
    }
  }

  async test(url: string, username?: string, password?: string): Promise<boolean> {
    try {
      const testClient = createClient(url, {
        username,
        password,
      });
      
      // Test the connection by trying to get directory contents
      await testClient.getDirectoryContents('/');
      return true;
    } catch (error) {
      throw new Error('Failed to connect to WebDAV server: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  private checkInitialized(): void {
    if (!this.isInitialized || !this.client) {
      throw new Error('WebDAV client is not initialized');
    }
  }

  async createDirectory(path: string): Promise<void> {
    this.checkInitialized();
    
    try {
      // Check if directory exists first
      const exists = await this.client!.exists(path);
      
      if (!exists) {
        await this.client!.createDirectory(path);
      }
    } catch (error) {
      throw new Error('Failed to create directory: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async putFile(path: string, content: string | Buffer): Promise<void> {
    this.checkInitialized();
    
    try {
      await this.client!.putFileContents(path, content);
    } catch (error) {
      throw new Error('Failed to upload file: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async getFile(path: string): Promise<string> {
    this.checkInitialized();
    
    try {
      const exists = await this.client!.exists(path);
      
      if (!exists) {
        throw new Error(`File not found: ${path}`);
      }
      
      const content = await this.client!.getFileContents(path, { format: 'text' });
      
      if (typeof content !== 'string') {
        throw new Error('Expected text content but received binary data');
      }
      
      return content;
    } catch (error) {
      throw new Error('Failed to download file: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async deleteFile(path: string): Promise<void> {
    this.checkInitialized();
    
    try {
      const exists = await this.client!.exists(path);
      
      if (exists) {
        await this.client!.deleteFile(path);
      }
    } catch (error) {
      throw new Error('Failed to delete file: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async listFiles(path: string): Promise<string[]> {
    this.checkInitialized();
    
    try {
      const contents = await this.client!.getDirectoryContents(path);
      
      if (Array.isArray(contents)) {
        return contents.map(item => item.filename);
      }
      
      return [];
    } catch (error) {
      throw new Error('Failed to list files: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  // Sync notes with WebDAV
  async syncNotes(notes: any[]): Promise<void> {
    this.checkInitialized();
    
    try {
      // Create notes directory if it doesn't exist
      await this.createDirectory('/notes');
      
      // Upload each note as a JSON file
      for (const note of notes) {
        const noteContent = JSON.stringify(note);
        await this.putFile(`/notes/${note.id}.json`, noteContent);
      }
    } catch (error) {
      throw new Error('Failed to sync notes: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  // Download notes from WebDAV
  async downloadNotes(): Promise<any[]> {
    this.checkInitialized();
    
    try {
      // Create notes directory if it doesn't exist
      await this.createDirectory('/notes');
      
      // Get all note files
      const files = await this.listFiles('/notes');
      const noteFiles = files.filter(file => file.endsWith('.json'));
      
      // Download and parse each note
      const notes = [];
      
      for (const file of noteFiles) {
        const content = await this.getFile(`/notes/${file}`);
        try {
          const note = JSON.parse(content);
          notes.push(note);
        } catch (e) {
          console.error(`Failed to parse note file ${file}:`, e);
        }
      }
      
      return notes;
    } catch (error) {
      throw new Error('Failed to download notes: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  // Export data to WebDAV
  async exportData(data: any): Promise<void> {
    this.checkInitialized();
    
    try {
      const content = JSON.stringify(data);
      await this.putFile('/notecraft_export.json', content);
    } catch (error) {
      throw new Error('Failed to export data: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  // Import data from WebDAV
  async importData(): Promise<any> {
    this.checkInitialized();
    
    try {
      const exists = await this.client!.exists('/notecraft_export.json');
      
      if (!exists) {
        throw new Error('No export file found');
      }
      
      const content = await this.getFile('/notecraft_export.json');
      return JSON.parse(content);
    } catch (error) {
      throw new Error('Failed to import data: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
}

// Create singleton instance
const webdavInstance = new WebDAVStorage();

// Hook to use WebDAV storage
export function useWebdav() {
  return webdavInstance;
}

export default webdavInstance;
