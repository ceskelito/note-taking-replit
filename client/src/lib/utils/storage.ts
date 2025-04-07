import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Folder, Note, Tag, NoteTag, User } from '@shared/schema';

// Define the database schema for IndexedDB
interface NoteKeeperDB extends DBSchema {
  notes: {
    key: number;
    value: Note;
    indexes: { 'by-folder': number; 'by-pinned': boolean };
  };
  folders: {
    key: number;
    value: Folder;
  };
  tags: {
    key: number;
    value: Tag;
  };
  noteTags: {
    key: number;
    value: NoteTag;
    indexes: { 'by-note': number; 'by-tag': number };
  };
  metadata: {
    key: string;
    value: {
      lastSyncTime: Date;
      userSettings: any;
    };
  };
}

let db: IDBPDatabase<NoteKeeperDB>;

// Initialize the IndexedDB database
export const initializeLocalStorage = async (): Promise<IDBPDatabase<NoteKeeperDB>> => {
  if (db) return db;
  
  db = await openDB<NoteKeeperDB>('notekeeper-db', 1, {
    upgrade(database, oldVersion, newVersion, transaction) {
      // Create object stores and indexes if they don't exist
      if (!database.objectStoreNames.contains('notes')) {
        const notesStore = database.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
        notesStore.createIndex('by-folder', 'folderId');
        notesStore.createIndex('by-pinned', 'pinned');
      }
      
      if (!database.objectStoreNames.contains('folders')) {
        database.createObjectStore('folders', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!database.objectStoreNames.contains('tags')) {
        database.createObjectStore('tags', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!database.objectStoreNames.contains('noteTags')) {
        const noteTagsStore = database.createObjectStore('noteTags', { keyPath: 'id', autoIncrement: true });
        noteTagsStore.createIndex('by-note', 'noteId');
        noteTagsStore.createIndex('by-tag', 'tagId');
      }
      
      if (!database.objectStoreNames.contains('metadata')) {
        database.createObjectStore('metadata', { keyPath: 'key' });
      }
    }
  });
  
  return db;
};

// Get all notes
export const getAllNotes = async (): Promise<Note[]> => {
  const database = await initializeLocalStorage();
  return database.getAll('notes');
};

// Get a note by ID
export const getNoteById = async (id: number): Promise<Note | undefined> => {
  const database = await initializeLocalStorage();
  return database.get('notes', id);
};

// Get notes by folder ID
export const getNotesByFolder = async (folderId: number): Promise<Note[]> => {
  const database = await initializeLocalStorage();
  return database.getAllFromIndex('notes', 'by-folder', folderId);
};

// Get pinned notes
export const getPinnedNotes = async (): Promise<Note[]> => {
  const database = await initializeLocalStorage();
  return database.getAllFromIndex('notes', 'by-pinned', true);
};

// Create or update a note
export const saveNote = async (note: Partial<Note>): Promise<Note> => {
  const database = await initializeLocalStorage();
  let noteToSave = { ...note };
  
  // If note has an ID and it's positive (not a temp ID), get the existing note
  if (note.id && note.id > 0) {
    const existingNote = await database.get('notes', note.id);
    if (existingNote) {
      noteToSave = { ...existingNote, ...note, updatedAt: new Date() };
    }
  } else {
    // New note
    noteToSave = {
      title: note.title || 'Untitled Note',
      content: note.content || '',
      folderId: note.folderId,
      userId: note.userId,
      pinned: note.pinned || false,
      color: note.color || null,
      font: note.font || 'Inter',
      fontSize: note.fontSize || '16px',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Note;
  }
  
  const id = await database.put('notes', noteToSave);
  
  // Get the saved note with its ID
  const savedNote = await database.get('notes', id);
  return savedNote as Note;
};

// Delete a note
export const deleteNote = async (id: number): Promise<boolean> => {
  const database = await initializeLocalStorage();
  
  // Also delete all note tags for this note
  const noteTags = await database.getAllFromIndex('noteTags', 'by-note', id);
  const tx = database.transaction(['notes', 'noteTags'], 'readwrite');
  
  for (const noteTag of noteTags) {
    await tx.objectStore('noteTags').delete(noteTag.id);
  }
  
  await tx.objectStore('notes').delete(id);
  await tx.done;
  
  return true;
};

// Get all folders
export const getAllFolders = async (): Promise<Folder[]> => {
  const database = await initializeLocalStorage();
  return database.getAll('folders');
};

// Get a folder by ID
export const getFolderById = async (id: number): Promise<Folder | undefined> => {
  const database = await initializeLocalStorage();
  return database.get('folders', id);
};

// Create or update a folder
export const saveFolder = async (folder: Partial<Folder>): Promise<Folder> => {
  const database = await initializeLocalStorage();
  let folderToSave = { ...folder };
  
  // If folder has an ID and it's positive (not a temp ID), get the existing folder
  if (folder.id && folder.id > 0) {
    const existingFolder = await database.get('folders', folder.id);
    if (existingFolder) {
      folderToSave = { ...existingFolder, ...folder };
    }
  } else {
    // New folder
    folderToSave = {
      name: folder.name || 'New Folder',
      userId: folder.userId,
      color: folder.color || null,
      createdAt: new Date(),
    } as Folder;
  }
  
  const id = await database.put('folders', folderToSave);
  
  // Get the saved folder with its ID
  const savedFolder = await database.get('folders', id);
  return savedFolder as Folder;
};

// Delete a folder
export const deleteFolder = async (id: number): Promise<boolean> => {
  const database = await initializeLocalStorage();
  
  // Get all notes in this folder
  const notes = await getNotesByFolder(id);
  
  // Start a transaction to delete folder and its notes
  const tx = database.transaction(['folders', 'notes', 'noteTags'], 'readwrite');
  
  // Delete all notes in the folder
  for (const note of notes) {
    // Delete note tags for each note
    const noteTags = await database.getAllFromIndex('noteTags', 'by-note', note.id);
    for (const noteTag of noteTags) {
      await tx.objectStore('noteTags').delete(noteTag.id);
    }
    
    // Delete the note
    await tx.objectStore('notes').delete(note.id);
  }
  
  // Delete the folder
  await tx.objectStore('folders').delete(id);
  await tx.done;
  
  return true;
};

// Get all tags
export const getAllTags = async (): Promise<Tag[]> => {
  const database = await initializeLocalStorage();
  return database.getAll('tags');
};

// Get a tag by ID
export const getTagById = async (id: number): Promise<Tag | undefined> => {
  const database = await initializeLocalStorage();
  return database.get('tags', id);
};

// Create or update a tag
export const saveTag = async (tag: Partial<Tag>): Promise<Tag> => {
  const database = await initializeLocalStorage();
  let tagToSave = { ...tag };
  
  // If tag has an ID and it's positive (not a temp ID), get the existing tag
  if (tag.id && tag.id > 0) {
    const existingTag = await database.get('tags', tag.id);
    if (existingTag) {
      tagToSave = { ...existingTag, ...tag };
    }
  } else {
    // New tag
    tagToSave = {
      name: tag.name || 'New Tag',
      userId: tag.userId,
      color: tag.color || null,
      createdAt: new Date(),
    } as Tag;
  }
  
  const id = await database.put('tags', tagToSave);
  
  // Get the saved tag with its ID
  const savedTag = await database.get('tags', id);
  return savedTag as Tag;
};

// Delete a tag
export const deleteTag = async (id: number): Promise<boolean> => {
  const database = await initializeLocalStorage();
  
  // Get all note tags for this tag
  const noteTags = await database.getAllFromIndex('noteTags', 'by-tag', id);
  
  // Start a transaction to delete tag and its note associations
  const tx = database.transaction(['tags', 'noteTags'], 'readwrite');
  
  // Delete all note tags for this tag
  for (const noteTag of noteTags) {
    await tx.objectStore('noteTags').delete(noteTag.id);
  }
  
  // Delete the tag
  await tx.objectStore('tags').delete(id);
  await tx.done;
  
  return true;
};

// Add a tag to a note
export const addTagToNote = async (noteId: number, tagId: number): Promise<NoteTag> => {
  const database = await initializeLocalStorage();
  
  // Check if this note-tag association already exists
  const existingNoteTags = await database.getAllFromIndex('noteTags', 'by-note', noteId);
  const exists = existingNoteTags.some(nt => nt.tagId === tagId);
  
  if (exists) {
    throw new Error('This tag is already added to the note');
  }
  
  const noteTag = {
    noteId,
    tagId,
  };
  
  const id = await database.put('noteTags', noteTag);
  
  // Get the saved note tag with its ID
  const savedNoteTag = await database.get('noteTags', id);
  return savedNoteTag as NoteTag;
};

// Remove a tag from a note
export const removeTagFromNote = async (noteId: number, tagId: number): Promise<boolean> => {
  const database = await initializeLocalStorage();
  
  // Find the note-tag association
  const noteTags = await database.getAllFromIndex('noteTags', 'by-note', noteId);
  const noteTag = noteTags.find(nt => nt.tagId === tagId);
  
  if (!noteTag) {
    throw new Error('Tag is not associated with this note');
  }
  
  // Delete the note-tag association
  await database.delete('noteTags', noteTag.id);
  
  return true;
};

// Get all tags for a note
export const getTagsForNote = async (noteId: number): Promise<Tag[]> => {
  const database = await initializeLocalStorage();
  
  // Get all note-tag associations for this note
  const noteTags = await database.getAllFromIndex('noteTags', 'by-note', noteId);
  
  // Get the tags for each association
  const tags: Tag[] = [];
  for (const noteTag of noteTags) {
    const tag = await database.get('tags', noteTag.tagId);
    if (tag) {
      tags.push(tag);
    }
  }
  
  return tags;
};

// Get all notes for a tag
export const getNotesForTag = async (tagId: number): Promise<Note[]> => {
  const database = await initializeLocalStorage();
  
  // Get all note-tag associations for this tag
  const noteTags = await database.getAllFromIndex('noteTags', 'by-tag', tagId);
  
  // Get the notes for each association
  const notes: Note[] = [];
  for (const noteTag of noteTags) {
    const note = await database.get('notes', noteTag.noteId);
    if (note) {
      notes.push(note);
    }
  }
  
  return notes;
};

// Save metadata
export const saveMetadata = async (key: string, value: any): Promise<void> => {
  const database = await initializeLocalStorage();
  await database.put('metadata', { key, ...value });
};

// Get metadata
export const getMetadata = async (key: string): Promise<any> => {
  const database = await initializeLocalStorage();
  return database.get('metadata', key);
};

// Export all data (for backups or syncing)
export const exportAllData = async (): Promise<{
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  noteTags: NoteTag[];
  metadata: any;
}> => {
  const database = await initializeLocalStorage();
  
  const notes = await database.getAll('notes');
  const folders = await database.getAll('folders');
  const tags = await database.getAll('tags');
  const noteTags = await database.getAll('noteTags');
  const metadataKeys = await database.getAllKeys('metadata');
  
  const metadata: Record<string, any> = {};
  for (const key of metadataKeys) {
    metadata[key] = await database.get('metadata', key);
  }
  
  return {
    notes,
    folders,
    tags,
    noteTags,
    metadata,
  };
};

// Import data (from backups or sync)
export const importAllData = async (data: {
  notes?: Note[];
  folders?: Folder[];
  tags?: Tag[];
  noteTags?: NoteTag[];
  metadata?: Record<string, any>;
}): Promise<void> => {
  const database = await initializeLocalStorage();
  
  // Start a transaction for all stores
  const tx = database.transaction(
    ['notes', 'folders', 'tags', 'noteTags', 'metadata'],
    'readwrite'
  );
  
  // Import folders
  if (data.folders && data.folders.length > 0) {
    const folderStore = tx.objectStore('folders');
    for (const folder of data.folders) {
      await folderStore.put(folder);
    }
  }
  
  // Import tags
  if (data.tags && data.tags.length > 0) {
    const tagStore = tx.objectStore('tags');
    for (const tag of data.tags) {
      await tagStore.put(tag);
    }
  }
  
  // Import notes
  if (data.notes && data.notes.length > 0) {
    const noteStore = tx.objectStore('notes');
    for (const note of data.notes) {
      await noteStore.put(note);
    }
  }
  
  // Import note tags
  if (data.noteTags && data.noteTags.length > 0) {
    const noteTagStore = tx.objectStore('noteTags');
    for (const noteTag of data.noteTags) {
      await noteTagStore.put(noteTag);
    }
  }
  
  // Import metadata
  if (data.metadata) {
    const metadataStore = tx.objectStore('metadata');
    for (const [key, value] of Object.entries(data.metadata)) {
      await metadataStore.put({ key, ...value });
    }
  }
  
  // Commit the transaction
  await tx.done;
};

// Clear all data
export const clearLocalStorage = async (): Promise<void> => {
  const database = await initializeLocalStorage();
  
  // Start a transaction for all stores
  const tx = database.transaction(
    ['notes', 'folders', 'tags', 'noteTags', 'metadata'],
    'readwrite'
  );
  
  // Clear all stores
  await tx.objectStore('notes').clear();
  await tx.objectStore('folders').clear();
  await tx.objectStore('tags').clear();
  await tx.objectStore('noteTags').clear();
  await tx.objectStore('metadata').clear();
  
  // Commit the transaction
  await tx.done;
};
