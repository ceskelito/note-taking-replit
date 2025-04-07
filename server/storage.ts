import { 
  users, folders, notes, tags, noteTags,
  type User, type Folder, type Note, type Tag, type NoteTag,
  type InsertUser, type InsertFolder, type InsertNote, type InsertTag, type InsertNoteTag,
  type NoteWithTags, type FolderWithNotes
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Folder operations
  getFolders(userId: number): Promise<Folder[]>;
  getFolder(id: number): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, folder: Partial<Folder>): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<boolean>;
  
  // Note operations
  getNotes(userId: number): Promise<Note[]>;
  getNotesWithTags(userId: number): Promise<NoteWithTags[]>;
  getNotesByFolder(folderId: number): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  getNoteWithTags(id: number): Promise<NoteWithTags | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, note: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;
  
  // Tag operations
  getTags(userId: number): Promise<Tag[]>;
  getTag(id: number): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: number, tag: Partial<Tag>): Promise<Tag | undefined>;
  deleteTag(id: number): Promise<boolean>;
  
  // Note-Tag operations
  addTagToNote(noteId: number, tagId: number): Promise<NoteTag>;
  removeTagFromNote(noteId: number, tagId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private folders: Map<number, Folder>;
  private notes: Map<number, Note>;
  private tags: Map<number, Tag>;
  private noteTags: Map<number, NoteTag>;
  
  private userIdCounter: number;
  private folderIdCounter: number;
  private noteIdCounter: number;
  private tagIdCounter: number;
  private noteTagIdCounter: number;

  constructor() {
    this.users = new Map();
    this.folders = new Map();
    this.notes = new Map();
    this.tags = new Map();
    this.noteTags = new Map();
    
    this.userIdCounter = 1;
    this.folderIdCounter = 1;
    this.noteIdCounter = 1;
    this.tagIdCounter = 1;
    this.noteTagIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Folder operations
  async getFolders(userId: number): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      (folder) => folder.userId === userId,
    );
  }

  async getFolder(id: number): Promise<Folder | undefined> {
    return this.folders.get(id);
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const id = this.folderIdCounter++;
    const folder: Folder = { ...insertFolder, id };
    this.folders.set(id, folder);
    return folder;
  }

  async updateFolder(id: number, folderData: Partial<Folder>): Promise<Folder | undefined> {
    const folder = this.folders.get(id);
    if (!folder) return undefined;
    
    const updatedFolder = { ...folder, ...folderData };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }

  async deleteFolder(id: number): Promise<boolean> {
    return this.folders.delete(id);
  }

  // Note operations
  async getNotes(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.userId === userId,
    );
  }

  async getNotesWithTags(userId: number): Promise<NoteWithTags[]> {
    const userNotes = await this.getNotes(userId);
    return Promise.all(
      userNotes.map(async (note) => {
        const tags = await this.getNoteTagsAsArray(note.id);
        return { ...note, tags };
      })
    );
  }

  async getNotesByFolder(folderId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.folderId === folderId,
    );
  }

  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async getNoteWithTags(id: number): Promise<NoteWithTags | undefined> {
    const note = await this.getNote(id);
    if (!note) return undefined;
    
    const tags = await this.getNoteTagsAsArray(id);
    return { ...note, tags };
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.noteIdCounter++;
    const now = new Date();
    const note: Note = { 
      ...insertNote, 
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: number, noteData: Partial<Note>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updatedNote = { 
      ...note, 
      ...noteData,
      updatedAt: new Date()
    };
    
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: number): Promise<boolean> {
    // Remove all note-tag associations
    Array.from(this.noteTags.values())
      .filter(noteTag => noteTag.noteId === id)
      .forEach(noteTag => this.noteTags.delete(noteTag.id));
      
    return this.notes.delete(id);
  }

  // Tag operations
  async getTags(userId: number): Promise<Tag[]> {
    return Array.from(this.tags.values()).filter(
      (tag) => tag.userId === userId,
    );
  }

  async getTag(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const id = this.tagIdCounter++;
    const tag: Tag = { ...insertTag, id };
    this.tags.set(id, tag);
    return tag;
  }

  async updateTag(id: number, tagData: Partial<Tag>): Promise<Tag | undefined> {
    const tag = this.tags.get(id);
    if (!tag) return undefined;
    
    const updatedTag = { ...tag, ...tagData };
    this.tags.set(id, updatedTag);
    return updatedTag;
  }

  async deleteTag(id: number): Promise<boolean> {
    // Remove all note-tag associations
    Array.from(this.noteTags.values())
      .filter(noteTag => noteTag.tagId === id)
      .forEach(noteTag => this.noteTags.delete(noteTag.id));
      
    return this.tags.delete(id);
  }

  // Note-Tag operations
  async addTagToNote(noteId: number, tagId: number): Promise<NoteTag> {
    // Check if this relationship already exists
    const existing = Array.from(this.noteTags.values()).find(
      nt => nt.noteId === noteId && nt.tagId === tagId
    );
    
    if (existing) return existing;
    
    const id = this.noteTagIdCounter++;
    const noteTag: NoteTag = { id, noteId, tagId };
    this.noteTags.set(id, noteTag);
    return noteTag;
  }

  async removeTagFromNote(noteId: number, tagId: number): Promise<boolean> {
    const noteTagEntry = Array.from(this.noteTags.entries()).find(
      ([_, nt]) => nt.noteId === noteId && nt.tagId === tagId
    );
    
    if (!noteTagEntry) return false;
    
    return this.noteTags.delete(noteTagEntry[0]);
  }

  // Helper methods
  private async getNoteTagsAsArray(noteId: number): Promise<Tag[]> {
    const noteTagRelations = Array.from(this.noteTags.values()).filter(
      (nt) => nt.noteId === noteId
    );
    
    return noteTagRelations.map(nt => {
      const tag = this.tags.get(nt.tagId);
      if (!tag) throw new Error(`Tag with id ${nt.tagId} not found`);
      return tag;
    });
  }
}

export const storage = new MemStorage();
