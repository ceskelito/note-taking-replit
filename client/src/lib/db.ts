import { createContext, useContext } from "react";
import { 
  type Folder, 
  type Note, 
  type Tag, 
  type NoteWithTags,
  type InsertFolder,
  type InsertNote,
  type InsertTag
} from "@shared/schema";

// IndexedDB database name and store names
const DB_NAME = "notecraft_db";
const DB_VERSION = 1;
const STORES = {
  folders: "folders",
  notes: "notes",
  tags: "tags",
  noteTags: "noteTags",
};

interface NoteTag {
  id: number;
  noteId: number;
  tagId: number;
}

// Define the local database interface
interface LocalDbInterface {
  init(): Promise<void>;
  
  // Folder operations
  getAllFolders(): Promise<Folder[]>;
  getFolder(id: number): Promise<Folder | undefined>;
  createFolder(folder: Partial<InsertFolder>): Promise<Folder>;
  updateFolder(id: number, folder: Partial<Folder>): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<boolean>;
  
  // Note operations
  getAllNotes(): Promise<NoteWithTags[]>;
  getNotesByFolder(folderId: number): Promise<NoteWithTags[]>;
  getNote(id: number): Promise<NoteWithTags | undefined>;
  createNote(note: Partial<InsertNote>): Promise<Note>;
  updateNote(id: number, note: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;
  
  // Tag operations
  getAllTags(): Promise<Tag[]>;
  getTag(id: number): Promise<Tag | undefined>;
  createTag(tag: Partial<InsertTag>): Promise<Tag>;
  updateTag(id: number, tag: Partial<Tag>): Promise<Tag | undefined>;
  deleteTag(id: number): Promise<boolean>;
  
  // Note-Tag operations
  addTagToNote(noteId: number, tagId: number): Promise<void>;
  removeTagFromNote(noteId: number, tagId: number): Promise<boolean>;
  
  // Export/Import operations
  exportData(): Promise<{ folders: Folder[]; notes: Note[]; tags: Tag[]; noteTags: NoteTag[] }>;
  importData(data: { folders: Folder[]; notes: Note[]; tags: Tag[]; noteTags: NoteTag[] }): Promise<void>;
}

class IndexedDBStorage implements LocalDbInterface {
  private db: IDBDatabase | null = null;
  private connectedPromise: Promise<void> | null = null;
  private idCounters: { [key: string]: number } = {};

  constructor() {
    this.db = null;
    this.connectedPromise = null;
    this.idCounters = {
      [STORES.folders]: 1,
      [STORES.notes]: 1,
      [STORES.tags]: 1,
      [STORES.noteTags]: 1,
    };
  }

  async init(): Promise<void> {
    if (this.connectedPromise) return this.connectedPromise;

    this.connectedPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.folders)) {
          db.createObjectStore(STORES.folders, { keyPath: "id" });
        }
        
        if (!db.objectStoreNames.contains(STORES.notes)) {
          db.createObjectStore(STORES.notes, { keyPath: "id" });
        }
        
        if (!db.objectStoreNames.contains(STORES.tags)) {
          db.createObjectStore(STORES.tags, { keyPath: "id" });
        }
        
        if (!db.objectStoreNames.contains(STORES.noteTags)) {
          const noteTagsStore = db.createObjectStore(STORES.noteTags, { keyPath: "id" });
          noteTagsStore.createIndex("noteId", "noteId", { unique: false });
          noteTagsStore.createIndex("tagId", "tagId", { unique: false });
          noteTagsStore.createIndex("noteId_tagId", ["noteId", "tagId"], { unique: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.loadIdCounters().then(resolve).catch(reject);
      };

      request.onerror = (event) => {
        reject(new Error(`Failed to open IndexedDB: ${(event.target as IDBOpenDBRequest).error}`));
      };
    });

    return this.connectedPromise;
  }

  private async loadIdCounters(): Promise<void> {
    // Load the highest ID for each store to ensure we don't reuse IDs
    for (const storeName of Object.values(STORES)) {
      const items = await this.getAllItems(storeName);
      if (items.length > 0) {
        // Type assertion to handle the 'unknown' type
        const maxId = Math.max(...items.map((item: any) => item.id));
        this.idCounters[storeName] = maxId + 1;
      }
    }
  }

  private getStore(storeName: string, mode: IDBTransactionMode = "readonly"): IDBObjectStore {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  private getNextId(storeName: string): number {
    return this.idCounters[storeName]++;
  }

  private getAllItems<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private getItem<T>(storeName: string, id: number): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || undefined);
      request.onerror = () => reject(request.error);
    });
  }

  private addItem<T extends { id?: number }>(storeName: string, item: T): Promise<T & { id: number }> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite");
      
      // Assign an ID if one doesn't exist
      if (item.id === undefined || item.id === 0) {
        item.id = this.getNextId(storeName);
      }
      
      // Use put instead of add to avoid "Key already exists" errors
      // This will replace the item if it exists, or add it if it doesn't
      const request = store.put(item);
      
      request.onsuccess = () => resolve(item as T & { id: number });
      request.onerror = () => reject(request.error);
    });
  }

  private updateItem<T extends { id: number }>(storeName: string, id: number, updates: Partial<T>): Promise<T | undefined> {
    return new Promise(async (resolve, reject) => {
      const store = this.getStore(storeName, "readwrite");
      
      // Get the existing item first
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existingItem = getRequest.result;
        
        if (!existingItem) {
          resolve(undefined);
          return;
        }
        
        // Update with new values
        const updatedItem = { ...existingItem, ...updates };
        
        const putRequest = store.put(updatedItem);
        
        putRequest.onsuccess = () => resolve(updatedItem as T);
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  private deleteItem(storeName: string, id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite");
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  private queryIndex<T>(storeName: string, indexName: string, key: IDBValidKey): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Folder operations
  async getAllFolders(): Promise<Folder[]> {
    await this.init();
    return this.getAllItems<Folder>(STORES.folders);
  }

  async getFolder(id: number): Promise<Folder | undefined> {
    await this.init();
    return this.getItem<Folder>(STORES.folders, id);
  }

  async createFolder(folder: Partial<InsertFolder>): Promise<Folder> {
    await this.init();
    const now = new Date();
    const newFolder: Folder = {
      id: 0, // Will be assigned in addItem
      name: folder.name || 'Untitled Folder',
      userId: folder.userId || null,
    };
    
    return this.addItem<Folder>(STORES.folders, newFolder);
  }

  async updateFolder(id: number, folder: Partial<Folder>): Promise<Folder | undefined> {
    await this.init();
    return this.updateItem<Folder>(STORES.folders, id, folder);
  }

  async deleteFolder(id: number): Promise<boolean> {
    await this.init();
    // First, get all notes in the folder and delete or update them
    const notes = await this.getNotesByFolder(id);
    
    for (const note of notes) {
      await this.updateNote(note.id, { folderId: null });
    }
    
    return this.deleteItem(STORES.folders, id);
  }

  // Note operations
  async getAllNotes(): Promise<NoteWithTags[]> {
    await this.init();
    const notes = await this.getAllItems<Note>(STORES.notes);
    
    // Fetch tags for each note
    const notesWithTags: NoteWithTags[] = await Promise.all(
      notes.map(async (note) => {
        const tags = await this.getNoteTagsAsArray(note.id);
        return { ...note, tags };
      })
    );
    
    return notesWithTags;
  }

  async getNotesByFolder(folderId: number): Promise<NoteWithTags[]> {
    await this.init();
    const allNotes = await this.getAllNotes();
    return allNotes.filter(note => note.folderId === folderId);
  }

  async getNote(id: number): Promise<NoteWithTags | undefined> {
    await this.init();
    const note = await this.getItem<Note>(STORES.notes, id);
    
    if (!note) return undefined;
    
    const tags = await this.getNoteTagsAsArray(id);
    return { ...note, tags };
  }

  async createNote(note: Partial<InsertNote>): Promise<Note> {
    await this.init();
    const now = new Date();
    
    const newNote: Note = {
      id: 0, // Will be assigned in addItem
      title: note.title || 'Untitled Note',
      content: note.content || '',
      preview: note.preview || '',
      backgroundColor: note.backgroundColor || '#ffffff',
      textColor: note.textColor || '#000000',
      fontFamily: note.fontFamily || 'Inter',
      isPinned: note.isPinned || false,
      folderId: note.folderId || null,
      userId: note.userId || null,
      createdAt: now,
      updatedAt: now
    };
    
    return this.addItem<Note>(STORES.notes, newNote);
  }

  async updateNote(id: number, note: Partial<Note>): Promise<Note | undefined> {
    await this.init();
    
    // Update the updatedAt timestamp
    const updates = {
      ...note,
      updatedAt: new Date()
    };
    
    return this.updateItem<Note>(STORES.notes, id, updates);
  }

  async deleteNote(id: number): Promise<boolean> {
    await this.init();
    
    // First, delete all note-tag relationships
    const noteTags = await this.queryIndex<NoteTag>(STORES.noteTags, 'noteId', id);
    
    for (const noteTag of noteTags) {
      await this.deleteItem(STORES.noteTags, noteTag.id);
    }
    
    return this.deleteItem(STORES.notes, id);
  }

  // Tag operations
  async getAllTags(): Promise<Tag[]> {
    await this.init();
    return this.getAllItems<Tag>(STORES.tags);
  }

  async getTag(id: number): Promise<Tag | undefined> {
    await this.init();
    return this.getItem<Tag>(STORES.tags, id);
  }

  async createTag(tag: Partial<InsertTag>): Promise<Tag> {
    await this.init();
    
    const newTag: Tag = {
      id: 0, // Will be assigned in addItem
      name: tag.name || 'New Tag',
      color: tag.color || '#3B82F6',
      userId: tag.userId || null
    };
    
    return this.addItem<Tag>(STORES.tags, newTag);
  }

  async updateTag(id: number, tag: Partial<Tag>): Promise<Tag | undefined> {
    await this.init();
    return this.updateItem<Tag>(STORES.tags, id, tag);
  }

  async deleteTag(id: number): Promise<boolean> {
    await this.init();
    
    // First, delete all note-tag relationships
    const noteTags = await this.queryIndex<NoteTag>(STORES.noteTags, 'tagId', id);
    
    for (const noteTag of noteTags) {
      await this.deleteItem(STORES.noteTags, noteTag.id);
    }
    
    return this.deleteItem(STORES.tags, id);
  }

  // Note-Tag operations
  async addTagToNote(noteId: number, tagId: number): Promise<void> {
    await this.init();
    
    try {
      // Try to find an existing relation with the same noteId and tagId
      // This is a more direct approach than querying the index
      const allNoteTags = await this.getAllItems<NoteTag>(STORES.noteTags);
      const existingRelation = allNoteTags.find(nt => nt.noteId === noteId && nt.tagId === tagId);
      
      if (!existingRelation) {
        // No existing relation found, so create a new one
        await this.addItem<NoteTag>(STORES.noteTags, {
          id: 0, // Will be assigned in addItem
          noteId,
          tagId
        });
      }
      // If relation already exists, do nothing
    } catch (error) {
      console.error("Error adding tag to note:", error);
      throw error;
    }
  }

  async removeTagFromNote(noteId: number, tagId: number): Promise<boolean> {
    await this.init();
    
    // Find the relationship
    const relations = await this.queryIndex<NoteTag>(
      STORES.noteTags, 
      'noteId_tagId', 
      [noteId, tagId]
    );
    
    if (relations.length === 0) {
      return false;
    }
    
    // Delete the relationship
    await this.deleteItem(STORES.noteTags, relations[0].id);
    return true;
  }

  // Helper method to get all tags for a note
  private async getNoteTagsAsArray(noteId: number): Promise<Tag[]> {
    const noteTagRelations = await this.queryIndex<NoteTag>(STORES.noteTags, 'noteId', noteId);
    
    const tagIds = noteTagRelations.map(relation => relation.tagId);
    const tags: Tag[] = [];
    
    for (const tagId of tagIds) {
      const tag = await this.getTag(tagId);
      if (tag) {
        tags.push(tag);
      }
    }
    
    return tags;
  }

  // Export/Import operations
  async exportData(): Promise<{ folders: Folder[]; notes: Note[]; tags: Tag[]; noteTags: NoteTag[] }> {
    await this.init();
    
    const folders = await this.getAllItems<Folder>(STORES.folders);
    const notes = await this.getAllItems<Note>(STORES.notes);
    const tags = await this.getAllItems<Tag>(STORES.tags);
    const noteTags = await this.getAllItems<NoteTag>(STORES.noteTags);
    
    return { folders, notes, tags, noteTags };
  }

  async importData(data: { folders: Folder[]; notes: Note[]; tags: Tag[]; noteTags: NoteTag[] }): Promise<void> {
    await this.init();
    
    // Clear all stores first
    const clearStore = async (storeName: string) => {
      const store = this.getStore(storeName, "readwrite");
      store.clear();
    };
    
    await clearStore(STORES.folders);
    await clearStore(STORES.notes);
    await clearStore(STORES.tags);
    await clearStore(STORES.noteTags);
    
    // Import data into each store
    for (const folder of data.folders) {
      await this.addItem(STORES.folders, folder);
    }
    
    for (const note of data.notes) {
      await this.addItem(STORES.notes, note);
    }
    
    for (const tag of data.tags) {
      await this.addItem(STORES.tags, tag);
    }
    
    for (const noteTag of data.noteTags) {
      await this.addItem(STORES.noteTags, noteTag);
    }
    
    // Update ID counters
    await this.loadIdCounters();
  }
}

// Create a single instance of the database
const localDbInstance = new IndexedDBStorage();

// Create a React context for the database
const LocalDbContext = createContext<LocalDbInterface | null>(null);

// Custom hook to use the database
export function useLocalDb(): LocalDbInterface {
  const context = useContext(LocalDbContext);
  
  if (!context) {
    return localDbInstance;
  }
  
  return context;
}

export default localDbInstance;
