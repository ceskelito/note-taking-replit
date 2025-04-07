import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as z from "zod";
import { 
  insertUserSchema, 
  insertFolderSchema, 
  insertNoteSchema, 
  insertTagSchema,
  type User,
} from "@shared/schema";

// Helper function to validate request body
function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  req: Request,
  res: Response
): z.infer<T> | null {
  try {
    return schema.parse(req.body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ 
        message: "Validation failed", 
        errors: err.errors 
      });
    } else {
      res.status(400).json({ message: "Invalid request data" });
    }
    return null;
  }
}

// Helper function to get user ID from session
function getUserId(req: Request): number | null {
  return req.session?.userId || null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const userData = validateRequest(insertUserSchema, req, res);
    if (!userData) return;

    try {
      // Check if user already exists
      const existingByUsername = await storage.getUserByUsername(userData.username);
      const existingByEmail = await storage.getUserByEmail(userData.email);
      
      if (existingByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      if (existingByEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const user = await storage.createUser(userData);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      // Set user session
      req.session.userId = user.id;
      
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set user session
      req.session.userId = user.id;
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Update user settings
  app.patch("/api/users/settings", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return password in response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // Folder routes
  app.get("/api/folders", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const folders = await storage.getFolders(userId);
      res.status(200).json(folders);
    } catch (err) {
      res.status(500).json({ message: "Failed to get folders" });
    }
  });

  app.post("/api/folders", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const folderData = validateRequest(insertFolderSchema, req, res);
    if (!folderData) return;

    try {
      // Ensure folder belongs to the authenticated user
      folderData.userId = userId;
      
      const folder = await storage.createFolder(folderData);
      res.status(201).json(folder);
    } catch (err) {
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  app.patch("/api/folders/:id", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const folderId = parseInt(req.params.id);
    
    if (isNaN(folderId)) {
      return res.status(400).json({ message: "Invalid folder ID" });
    }

    try {
      const folder = await storage.getFolder(folderId);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      if (folder.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this folder" });
      }

      const updatedFolder = await storage.updateFolder(folderId, req.body);
      
      if (!updatedFolder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      res.status(200).json(updatedFolder);
    } catch (err) {
      res.status(500).json({ message: "Failed to update folder" });
    }
  });

  app.delete("/api/folders/:id", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const folderId = parseInt(req.params.id);
    
    if (isNaN(folderId)) {
      return res.status(400).json({ message: "Invalid folder ID" });
    }

    try {
      const folder = await storage.getFolder(folderId);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      if (folder.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this folder" });
      }

      await storage.deleteFolder(folderId);
      res.status(200).json({ message: "Folder deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // Note routes
  app.get("/api/notes", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const notes = await storage.getNotesWithTags(userId);
      res.status(200).json(notes);
    } catch (err) {
      res.status(500).json({ message: "Failed to get notes" });
    }
  });

  app.get("/api/folders/:id/notes", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const folderId = parseInt(req.params.id);
    
    if (isNaN(folderId)) {
      return res.status(400).json({ message: "Invalid folder ID" });
    }

    try {
      const folder = await storage.getFolder(folderId);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      if (folder.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this folder" });
      }

      const notes = await storage.getNotesByFolder(folderId);
      res.status(200).json(notes);
    } catch (err) {
      res.status(500).json({ message: "Failed to get notes" });
    }
  });

  app.get("/api/notes/:id", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const noteId = parseInt(req.params.id);
    
    if (isNaN(noteId)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }

    try {
      const note = await storage.getNoteWithTags(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      if (note.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this note" });
      }
      
      res.status(200).json(note);
    } catch (err) {
      res.status(500).json({ message: "Failed to get note" });
    }
  });

  app.post("/api/notes", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const noteData = validateRequest(insertNoteSchema, req, res);
    if (!noteData) return;

    try {
      // Ensure note belongs to the authenticated user
      noteData.userId = userId;
      
      // If folder is specified, check it exists and belongs to user
      if (noteData.folderId) {
        const folder = await storage.getFolder(noteData.folderId);
        
        if (!folder) {
          return res.status(404).json({ message: "Folder not found" });
        }
        
        if (folder.userId !== userId) {
          return res.status(403).json({ message: "Not authorized to use this folder" });
        }
      }
      
      const note = await storage.createNote(noteData);
      res.status(201).json(note);
    } catch (err) {
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.patch("/api/notes/:id", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const noteId = parseInt(req.params.id);
    
    if (isNaN(noteId)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }

    try {
      const note = await storage.getNote(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      if (note.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this note" });
      }

      // If folder is being updated, check it exists and belongs to user
      if (req.body.folderId) {
        const folder = await storage.getFolder(req.body.folderId);
        
        if (!folder) {
          return res.status(404).json({ message: "Folder not found" });
        }
        
        if (folder.userId !== userId) {
          return res.status(403).json({ message: "Not authorized to use this folder" });
        }
      }

      const updatedNote = await storage.updateNote(noteId, req.body);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.status(200).json(updatedNote);
    } catch (err) {
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const noteId = parseInt(req.params.id);
    
    if (isNaN(noteId)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }

    try {
      const note = await storage.getNote(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      if (note.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this note" });
      }

      await storage.deleteNote(noteId);
      res.status(200).json({ message: "Note deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Tag routes
  app.get("/api/tags", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const tags = await storage.getTags(userId);
      res.status(200).json(tags);
    } catch (err) {
      res.status(500).json({ message: "Failed to get tags" });
    }
  });

  app.post("/api/tags", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const tagData = validateRequest(insertTagSchema, req, res);
    if (!tagData) return;

    try {
      // Ensure tag belongs to the authenticated user
      tagData.userId = userId;
      
      const tag = await storage.createTag(tagData);
      res.status(201).json(tag);
    } catch (err) {
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  app.patch("/api/tags/:id", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const tagId = parseInt(req.params.id);
    
    if (isNaN(tagId)) {
      return res.status(400).json({ message: "Invalid tag ID" });
    }

    try {
      const tag = await storage.getTag(tagId);
      
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      if (tag.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this tag" });
      }

      const updatedTag = await storage.updateTag(tagId, req.body);
      
      if (!updatedTag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      res.status(200).json(updatedTag);
    } catch (err) {
      res.status(500).json({ message: "Failed to update tag" });
    }
  });

  app.delete("/api/tags/:id", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const tagId = parseInt(req.params.id);
    
    if (isNaN(tagId)) {
      return res.status(400).json({ message: "Invalid tag ID" });
    }

    try {
      const tag = await storage.getTag(tagId);
      
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      if (tag.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this tag" });
      }

      await storage.deleteTag(tagId);
      res.status(200).json({ message: "Tag deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Note-Tag operations
  app.post("/api/notes/:noteId/tags/:tagId", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const noteId = parseInt(req.params.noteId);
    const tagId = parseInt(req.params.tagId);
    
    if (isNaN(noteId) || isNaN(tagId)) {
      return res.status(400).json({ message: "Invalid note or tag ID" });
    }

    try {
      const note = await storage.getNote(noteId);
      const tag = await storage.getTag(tagId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      if (note.userId !== userId || tag.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to perform this action" });
      }

      const noteTag = await storage.addTagToNote(noteId, tagId);
      res.status(201).json(noteTag);
    } catch (err) {
      res.status(500).json({ message: "Failed to add tag to note" });
    }
  });

  app.delete("/api/notes/:noteId/tags/:tagId", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const noteId = parseInt(req.params.noteId);
    const tagId = parseInt(req.params.tagId);
    
    if (isNaN(noteId) || isNaN(tagId)) {
      return res.status(400).json({ message: "Invalid note or tag ID" });
    }

    try {
      const note = await storage.getNote(noteId);
      const tag = await storage.getTag(tagId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      if (note.userId !== userId || tag.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to perform this action" });
      }

      await storage.removeTagFromNote(noteId, tagId);
      res.status(200).json({ message: "Tag removed from note successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to remove tag from note" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
