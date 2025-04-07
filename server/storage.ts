import { 
  User, InsertUser, 
  Folder, InsertFolder, 
  Tag, InsertTag, 
  Note, InsertNote, 
  NoteTag, InsertNoteTag,
  WebDAVConfig
} from "@shared/schema";
import bcrypt from "bcryptjs";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validatePassword(userId: number, password: string): Promise<boolean>;
  
  // WebDAV operations
  getWebDAVConfig(userId: number): Promise<WebDAVConfig | undefined>;
  updateWebDAVConfig(userId: number, config: WebDAVConfig): Promise<WebDAVConfig>;
  
  // Note operations
  getNote(id: number): Promise<Note | undefined>;
  getNotesByUser(userId: number): Promise<Note[]>;
  getLocalNotes(): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, note: Partial<Note>): Promise<Note>;
  deleteNote(id: number): Promise<boolean>;
  
  // Folder operations
  getFolder(id: number): Promise<Folder | undefined>;
  getFoldersByUser(userId: number): Promise<Folder[]>;
  getLocalFolders(): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, folder: Partial<Folder>): Promise<Folder>;
  deleteFolder(id: number): Promise<boolean>;
  
  // Tag operations
  getTag(id: number): Promise<Tag | undefined>;
  getTagsByUser(userId: number): Promise<Tag[]>;
  getLocalTags(): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: number, tag: Partial<Tag>): Promise<Tag>;
  deleteTag(id: number): Promise<boolean>;
  
  // Note-Tag operations
  getNoteTag(id: number): Promise<NoteTag | undefined>;
  getNoteTagsByUser(userId: number): Promise<NoteTag[]>;
  addTagToNote(noteId: number, tagId: number): Promise<NoteTag>;
  removeTagFromNote(noteId: number, tagId: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private webdavConfigs: Map<number, WebDAVConfig>;
  private notes: Map<number, Note>;
  private folders: Map<number, Folder>;
  private tags: Map<number, Tag>;
  private noteTags: Map<number, NoteTag>;
  private currentUserId: number;
  private currentNoteId: number;
  private currentFolderId: number;
  private currentTagId: number;
  private currentNoteTagId: number;
  
  constructor() {
    this.users = new Map();
    this.webdavConfigs = new Map();
    this.notes = new Map();
    this.folders = new Map();
    this.tags = new Map();
    this.noteTags = new Map();
    this.currentUserId = 1;
    this.currentNoteId = 1;
    this.currentFolderId = 1;
    this.currentTagId = 1;
    this.currentNoteTagId = 1;
    
    // Initialize with some sample data
    this.initializeSampleData();
  }
  
  private async initializeSampleData() {
    // Create a sample user
    const sampleUser = await this.createUser({
      email: "demo@example.com",
      password: "password123",
      phone: null,
      webdavConfig: null,
    });
    
    // Create sample folders
    const personalFolder = await this.createFolder({
      name: "Personal",
      userId: sampleUser.id,
      color: "yellow",
    });
    
    const workFolder = await this.createFolder({
      name: "Work",
      userId: sampleUser.id,
      color: "blue",
    });
    
    const ideasFolder = await this.createFolder({
      name: "Ideas",
      userId: sampleUser.id,
      color: "green",
    });
    
    // Create sample tags
    const importantTag = await this.createTag({
      name: "Important",
      userId: sampleUser.id,
      color: "red",
    });
    
    const researchTag = await this.createTag({
      name: "Research",
      userId: sampleUser.id,
      color: "blue",
    });
    
    const projectsTag = await this.createTag({
      name: "Projects",
      userId: sampleUser.id,
      color: "green",
    });
    
    const learningTag = await this.createTag({
      name: "Learning",
      userId: sampleUser.id,
      color: "purple",
    });
    
    // Create sample notes
    const projectIdeasNote = await this.createNote({
      title: "Project ideas",
      content: "<h1>Project Ideas</h1><p>Here are some project ideas for the upcoming quarter. We should prioritize the ones with highest ROI.</p><ul><li>Mobile app redesign</li><li>API performance optimization</li><li>New customer portal features</li><li>Integration with partner services</li></ul>",
      folderId: workFolder.id,
      userId: sampleUser.id,
      pinned: false,
      color: null,
      font: "Inter",
      fontSize: "16px",
    });
    
    const meetingNotesNote = await this.createNote({
      title: "Meeting notes",
      content: "<h1>Team Meeting Notes - Q3 Planning</h1><p><strong>Date:</strong> May 12, 2023</p><p><strong>Attendees:</strong> Sarah, Michael, David, Jennifer, Alex</p><h2>Agenda</h2><ol><li>Q2 Review</li><li>Q3 Objectives</li><li>Resource Allocation</li><li>Timeline and Milestones</li><li>Open Discussion</li></ol><h2>Q2 Review</h2><ul><li>Completed the customer portal redesign ahead of schedule</li><li>Mobile app launch delayed by 2 weeks due to QA issues</li><li>Customer satisfaction score improved from 87% to 92%</li><li>New feature adoption rate exceeded expectations (68% vs 50% target)</li></ul>",
      folderId: workFolder.id,
      userId: sampleUser.id,
      pinned: true,
      color: "blue",
      font: "Inter",
      fontSize: "16px",
    });
    
    const bookRecommendationsNote = await this.createNote({
      title: "Book recommendations",
      content: "<h1>Books to Read This Summer</h1><p>A collection of books I want to read during summer break:</p><ul><li><strong>Atomic Habits</strong> by James Clear</li><li><strong>Deep Work</strong> by Cal Newport</li><li><strong>The Psychology of Money</strong> by Morgan Housel</li><li><strong>Project Hail Mary</strong> by Andy Weir</li><li><strong>The Midnight Library</strong> by Matt Haig</li></ul>",
      folderId: personalFolder.id,
      userId: sampleUser.id,
      pinned: false,
      color: null,
      font: "Inter",
      fontSize: "16px",
    });
    
    const appArchitectureNote = await this.createNote({
      title: "App architecture",
      content: "<h1>Notes on App Architecture</h1><p>Implementation details for data sync between storage options:</p><h2>Storage Options</h2><ul><li><strong>Local Storage</strong> - IndexedDB for offline use</li><li><strong>WebDAV</strong> - Sync with Nextcloud or similar</li><li><strong>Supabase</strong> - Cloud storage with authentication</li></ul><h2>Sync Strategy</h2><p>Implement a merge strategy that resolves conflicts based on timestamps. Use optimistic UI updates for better UX.</p><pre><code>// Example sync logic\nasync function syncData() {\n  const localData = await getLocalData();\n  const remoteData = await fetchRemoteData();\n  \n  const mergedData = mergeData(localData, remoteData);\n  \n  await saveLocalData(mergedData);\n  await uploadRemoteData(mergedData);\n}</code></pre>",
      folderId: ideasFolder.id,
      userId: sampleUser.id,
      pinned: false,
      color: "green",
      font: "Inter",
      fontSize: "16px",
    });
    
    // Add tags to notes
    await this.addTagToNote(projectIdeasNote.id, projectsTag.id);
    await this.addTagToNote(projectIdeasNote.id, importantTag.id);
    
    await this.addTagToNote(meetingNotesNote.id, projectsTag.id);
    await this.addTagToNote(meetingNotesNote.id, importantTag.id);
    
    await this.addTagToNote(bookRecommendationsNote.id, learningTag.id);
    
    await this.addTagToNote(appArchitectureNote.id, researchTag.id);
    await this.addTagToNote(appArchitectureNote.id, projectsTag.id);
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const user: User = { 
      id, 
      email: userData.email, 
      password: hashedPassword,
      phone: userData.phone || null,
      createdAt: new Date(),
      webdavConfig: userData.webdavConfig || null,
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async validatePassword(userId: number, password: string): Promise<boolean> {
    const user = await this.getUser(userId);
    
    if (!user) {
      return false;
    }
    
    return bcrypt.compare(password, user.password);
  }
  
  // WebDAV methods
  async getWebDAVConfig(userId: number): Promise<WebDAVConfig | undefined> {
    return this.webdavConfigs.get(userId);
  }
  
  async updateWebDAVConfig(userId: number, config: WebDAVConfig): Promise<WebDAVConfig> {
    // Validate user exists
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    this.webdavConfigs.set(userId, config);
    
    // Update user with webdav config
    const updatedUser = { ...user, webdavConfig: config };
    this.users.set(userId, updatedUser);
    
    return config;
  }
  
  // Note methods
  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }
  
  async getNotesByUser(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.userId === userId
    );
  }
  
  async getLocalNotes(): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.userId === null
    );
  }
  
  async createNote(noteData: InsertNote): Promise<Note> {
    const id = this.currentNoteId++;
    
    const note: Note = {
      id,
      title: noteData.title,
      content: noteData.content,
      folderId: noteData.folderId || null,
      userId: noteData.userId || null,
      pinned: noteData.pinned || false,
      color: noteData.color || null,
      font: noteData.font || 'Inter',
      fontSize: noteData.fontSize || '16px',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.notes.set(id, note);
    return note;
  }
  
  async updateNote(id: number, noteData: Partial<Note>): Promise<Note> {
    const note = await this.getNote(id);
    
    if (!note) {
      throw new Error('Note not found');
    }
    
    const updatedNote = { 
      ...note, 
      ...noteData, 
      updatedAt: new Date()
    };
    
    this.notes.set(id, updatedNote);
    return updatedNote;
  }
  
  async deleteNote(id: number): Promise<boolean> {
    const note = await this.getNote(id);
    
    if (!note) {
      throw new Error('Note not found');
    }
    
    // Delete all note tags associated with this note
    for (const [noteTagId, noteTag] of this.noteTags.entries()) {
      if (noteTag.noteId === id) {
        this.noteTags.delete(noteTagId);
      }
    }
    
    return this.notes.delete(id);
  }
  
  // Folder methods
  async getFolder(id: number): Promise<Folder | undefined> {
    return this.folders.get(id);
  }
  
  async getFoldersByUser(userId: number): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      (folder) => folder.userId === userId
    );
  }
  
  async getLocalFolders(): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      (folder) => folder.userId === null
    );
  }
  
  async createFolder(folderData: InsertFolder): Promise<Folder> {
    const id = this.currentFolderId++;
    
    const folder: Folder = {
      id,
      name: folderData.name,
      userId: folderData.userId || null,
      color: folderData.color || null,
      createdAt: new Date(),
    };
    
    this.folders.set(id, folder);
    return folder;
  }
  
  async updateFolder(id: number, folderData: Partial<Folder>): Promise<Folder> {
    const folder = await this.getFolder(id);
    
    if (!folder) {
      throw new Error('Folder not found');
    }
    
    const updatedFolder = { ...folder, ...folderData };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }
  
  async deleteFolder(id: number): Promise<boolean> {
    const folder = await this.getFolder(id);
    
    if (!folder) {
      throw new Error('Folder not found');
    }
    
    // Update all notes in this folder to have no folder
    for (const [noteId, note] of this.notes.entries()) {
      if (note.folderId === id) {
        const updatedNote = { ...note, folderId: null };
        this.notes.set(noteId, updatedNote);
      }
    }
    
    return this.folders.delete(id);
  }
  
  // Tag methods
  async getTag(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }
  
  async getTagsByUser(userId: number): Promise<Tag[]> {
    return Array.from(this.tags.values()).filter(
      (tag) => tag.userId === userId
    );
  }
  
  async getLocalTags(): Promise<Tag[]> {
    return Array.from(this.tags.values()).filter(
      (tag) => tag.userId === null
    );
  }
  
  async createTag(tagData: InsertTag): Promise<Tag> {
    const id = this.currentTagId++;
    
    const tag: Tag = {
      id,
      name: tagData.name,
      userId: tagData.userId || null,
      color: tagData.color || null,
      createdAt: new Date(),
    };
    
    this.tags.set(id, tag);
    return tag;
  }
  
  async updateTag(id: number, tagData: Partial<Tag>): Promise<Tag> {
    const tag = await this.getTag(id);
    
    if (!tag) {
      throw new Error('Tag not found');
    }
    
    const updatedTag = { ...tag, ...tagData };
    this.tags.set(id, updatedTag);
    return updatedTag;
  }
  
  async deleteTag(id: number): Promise<boolean> {
    const tag = await this.getTag(id);
    
    if (!tag) {
      throw new Error('Tag not found');
    }
    
    // Delete all note tags associated with this tag
    for (const [noteTagId, noteTag] of this.noteTags.entries()) {
      if (noteTag.tagId === id) {
        this.noteTags.delete(noteTagId);
      }
    }
    
    return this.tags.delete(id);
  }
  
  // Note-Tag methods
  async getNoteTag(id: number): Promise<NoteTag | undefined> {
    return this.noteTags.get(id);
  }
  
  async getNoteTagsByUser(userId: number): Promise<NoteTag[]> {
    const userNotes = await this.getNotesByUser(userId);
    const userNoteIds = userNotes.map(note => note.id);
    
    return Array.from(this.noteTags.values()).filter(
      (noteTag) => userNoteIds.includes(noteTag.noteId)
    );
  }
  
  async addTagToNote(noteId: number, tagId: number): Promise<NoteTag> {
    // Check if note and tag exist
    const note = await this.getNote(noteId);
    const tag = await this.getTag(tagId);
    
    if (!note) {
      throw new Error('Note not found');
    }
    
    if (!tag) {
      throw new Error('Tag not found');
    }
    
    // Check if the association already exists
    const existingNoteTag = Array.from(this.noteTags.values()).find(
      (noteTag) => noteTag.noteId === noteId && noteTag.tagId === tagId
    );
    
    if (existingNoteTag) {
      return existingNoteTag;
    }
    
    const id = this.currentNoteTagId++;
    
    const noteTag: NoteTag = {
      id,
      noteId,
      tagId,
    };
    
    this.noteTags.set(id, noteTag);
    return noteTag;
  }
  
  async removeTagFromNote(noteId: number, tagId: number): Promise<boolean> {
    // Find the note-tag association
    const noteTag = Array.from(this.noteTags.values()).find(
      (nt) => nt.noteId === noteId && nt.tagId === tagId
    );
    
    if (!noteTag) {
      throw new Error('Tag is not associated with this note');
    }
    
    return this.noteTags.delete(noteTag.id);
  }
}

// Initialize storage
export const storage = new MemStorage();
