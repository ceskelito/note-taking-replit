import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertFolderSchema, 
  insertTagSchema, 
  insertNoteSchema, 
  insertNoteTagSchema,
  webdavConfigSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // Auth endpoints
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      
      // Create a session
      req.session.userId = user.id;
      
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      const isPasswordValid = await storage.validatePassword(user.id, password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Create a session
      req.session.userId = user.id;
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      
      res.json({ success: true });
    });
  });
  
  app.get('/api/auth/me', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // WebDAV endpoints
  app.get('/api/webdav/config', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const config = await storage.getWebDAVConfig(req.session.userId);
      
      res.json(config || { endpoint: '', enabled: false });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.put('/api/webdav/config', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const validatedData = webdavConfigSchema.parse(req.body);
      const config = await storage.updateWebDAVConfig(req.session.userId, validatedData);
      
      res.json(config);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Notes endpoints
  app.get('/api/notes', async (req, res) => {
    try {
      let notes;
      
      if (req.session.userId) {
        // Get user's notes if logged in
        notes = await storage.getNotesByUser(req.session.userId);
      } else {
        // Get local notes if not logged in
        notes = await storage.getLocalNotes();
      }
      
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.post('/api/notes', async (req, res) => {
    try {
      const validatedData = insertNoteSchema.parse({
        ...req.body,
        userId: req.session.userId || null
      });
      
      const note = await storage.createNote(validatedData);
      
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.get('/api/notes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid note ID' });
      }
      
      const note = await storage.getNote(id);
      
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      // Check if the note belongs to the current user
      if (note.userId && note.userId !== req.session.userId) {
        return res.status(403).json({ error: 'You do not have permission to access this note' });
      }
      
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.put('/api/notes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid note ID' });
      }
      
      const note = await storage.getNote(id);
      
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      // Check if the note belongs to the current user
      if (note.userId && note.userId !== req.session.userId) {
        return res.status(403).json({ error: 'You do not have permission to update this note' });
      }
      
      const validatedData = insertNoteSchema.partial().parse({
        ...req.body,
        id,
        userId: req.session.userId || null
      });
      
      const updatedNote = await storage.updateNote(id, validatedData);
      
      res.json(updatedNote);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.delete('/api/notes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid note ID' });
      }
      
      const note = await storage.getNote(id);
      
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      // Check if the note belongs to the current user
      if (note.userId && note.userId !== req.session.userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this note' });
      }
      
      await storage.deleteNote(id);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Folders endpoints
  app.get('/api/folders', async (req, res) => {
    try {
      let folders;
      
      if (req.session.userId) {
        // Get user's folders if logged in
        folders = await storage.getFoldersByUser(req.session.userId);
      } else {
        // Get local folders if not logged in
        folders = await storage.getLocalFolders();
      }
      
      res.json(folders);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.post('/api/folders', async (req, res) => {
    try {
      const validatedData = insertFolderSchema.parse({
        ...req.body,
        userId: req.session.userId || null
      });
      
      const folder = await storage.createFolder(validatedData);
      
      res.status(201).json(folder);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.get('/api/folders/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid folder ID' });
      }
      
      const folder = await storage.getFolder(id);
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
      
      // Check if the folder belongs to the current user
      if (folder.userId && folder.userId !== req.session.userId) {
        return res.status(403).json({ error: 'You do not have permission to access this folder' });
      }
      
      res.json(folder);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.put('/api/folders/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid folder ID' });
      }
      
      const folder = await storage.getFolder(id);
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
      
      // Check if the folder belongs to the current user
      if (folder.userId && folder.userId !== req.session.userId) {
        return res.status(403).json({ error: 'You do not have permission to update this folder' });
      }
      
      const validatedData = insertFolderSchema.partial().parse({
        ...req.body,
        id,
        userId: req.session.userId || null
      });
      
      const updatedFolder = await storage.updateFolder(id, validatedData);
      
      res.json(updatedFolder);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.delete('/api/folders/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid folder ID' });
      }
      
      const folder = await storage.getFolder(id);
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
      
      // Check if the folder belongs to the current user
      if (folder.userId && folder.userId !== req.session.userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this folder' });
      }
      
      await storage.deleteFolder(id);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Tags endpoints
  app.get('/api/tags', async (req, res) => {
    try {
      let tags;
      
      if (req.session.userId) {
        // Get user's tags if logged in
        tags = await storage.getTagsByUser(req.session.userId);
      } else {
        // Get local tags if not logged in
        tags = await storage.getLocalTags();
      }
      
      res.json(tags);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.post('/api/tags', async (req, res) => {
    try {
      const validatedData = insertTagSchema.parse({
        ...req.body,
        userId: req.session.userId || null
      });
      
      const tag = await storage.createTag(validatedData);
      
      res.status(201).json(tag);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.get('/api/tags/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid tag ID' });
      }
      
      const tag = await storage.getTag(id);
      
      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      
      // Check if the tag belongs to the current user
      if (tag.userId && tag.userId !== req.session.userId) {
        return res.status(403).json({ error: 'You do not have permission to access this tag' });
      }
      
      res.json(tag);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.put('/api/tags/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid tag ID' });
      }
      
      const tag = await storage.getTag(id);
      
      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      
      // Check if the tag belongs to the current user
      if (tag.userId && tag.userId !== req.session.userId) {
        return res.status(403).json({ error: 'You do not have permission to update this tag' });
      }
      
      const validatedData = insertTagSchema.partial().parse({
        ...req.body,
        id,
        userId: req.session.userId || null
      });
      
      const updatedTag = await storage.updateTag(id, validatedData);
      
      res.json(updatedTag);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.delete('/api/tags/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid tag ID' });
      }
      
      const tag = await storage.getTag(id);
      
      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      
      // Check if the tag belongs to the current user
      if (tag.userId && tag.userId !== req.session.userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this tag' });
      }
      
      await storage.deleteTag(id);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Note Tags endpoints
  app.post('/api/note-tags', async (req, res) => {
    try {
      const validatedData = insertNoteTagSchema.parse(req.body);
      
      // Check if the note and tag exist and belong to the current user
      const note = await storage.getNote(validatedData.noteId);
      const tag = await storage.getTag(validatedData.tagId);
      
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      
      // Check if the note belongs to the current user
      if (note.userId && note.userId !== req.session.userId) {
        return res.status(403).json({ error: 'You do not have permission to update this note' });
      }
      
      // Check if the tag belongs to the current user
      if (tag.userId && tag.userId !== req.session.userId) {
        return res.status(403).json({ error: 'You do not have permission to use this tag' });
      }
      
      const noteTag = await storage.addTagToNote(validatedData.noteId, validatedData.tagId);
      
      res.status(201).json(noteTag);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.delete('/api/note-tags/:noteId/:tagId', async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);
      const tagId = parseInt(req.params.tagId);
      
      if (isNaN(noteId) || isNaN(tagId)) {
        return res.status(400).json({ error: 'Invalid note or tag ID' });
      }
      
      // Check if the note and tag exist and belong to the current user
      const note = await storage.getNote(noteId);
      const tag = await storage.getTag(tagId);
      
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      
      // Check if the note belongs to the current user
      if (note.userId && note.userId !== req.session.userId) {
        return res.status(403).json({ error: 'You do not have permission to update this note' });
      }
      
      await storage.removeTagFromNote(noteId, tagId);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Supabase sync endpoints
  app.get('/api/supabase/test', (req, res) => {
    // Just a simple endpoint to test if Supabase connection is working
    res.json({ success: true });
  });
  
  app.get('/api/supabase/notes', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const notes = await storage.getNotesByUser(req.session.userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.get('/api/supabase/folders', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const folders = await storage.getFoldersByUser(req.session.userId);
      res.json(folders);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.get('/api/supabase/tags', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const tags = await storage.getTagsByUser(req.session.userId);
      res.json(tags);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.get('/api/supabase/note-tags', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const noteTags = await storage.getNoteTagsByUser(req.session.userId);
      res.json(noteTags);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.post('/api/supabase/sync', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const { notes, folders, tags, noteTags } = req.body;
      
      // Sync data with Supabase
      if (notes) {
        for (const note of notes) {
          if (note.id > 0) {
            // Update existing note
            await storage.updateNote(note.id, { ...note, userId: req.session.userId });
          } else {
            // Create new note
            await storage.createNote({ ...note, userId: req.session.userId });
          }
        }
      }
      
      if (folders) {
        for (const folder of folders) {
          if (folder.id > 0) {
            // Update existing folder
            await storage.updateFolder(folder.id, { ...folder, userId: req.session.userId });
          } else {
            // Create new folder
            await storage.createFolder({ ...folder, userId: req.session.userId });
          }
        }
      }
      
      if (tags) {
        for (const tag of tags) {
          if (tag.id > 0) {
            // Update existing tag
            await storage.updateTag(tag.id, { ...tag, userId: req.session.userId });
          } else {
            // Create new tag
            await storage.createTag({ ...tag, userId: req.session.userId });
          }
        }
      }
      
      if (noteTags) {
        for (const noteTag of noteTags) {
          // Check if the note and tag belong to the current user
          const note = await storage.getNote(noteTag.noteId);
          const tag = await storage.getTag(noteTag.tagId);
          
          if (note && tag && note.userId === req.session.userId && (!tag.userId || tag.userId === req.session.userId)) {
            await storage.addTagToNote(noteTag.noteId, noteTag.tagId);
          }
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
