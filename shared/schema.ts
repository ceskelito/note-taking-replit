import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  webdavConfig: jsonb("webdav_config"),
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  folderId: integer("folder_id").references(() => folders.id),
  userId: integer("user_id").references(() => users.id),
  pinned: boolean("pinned").default(false),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  font: text("font"),
  fontSize: text("font_size"),
});

export const noteTags = pgTable("note_tags", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").references(() => notes.id).notNull(),
  tagId: integer("tag_id").references(() => tags.id).notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  phone: true,
  webdavConfig: true,
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  userId: true,
  color: true,
});

export const insertTagSchema = createInsertSchema(tags).pick({
  name: true,
  userId: true,
  color: true,
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  title: true,
  content: true,
  folderId: true,
  userId: true,
  pinned: true,
  color: true,
  font: true,
  fontSize: true,
});

export const insertNoteTagSchema = createInsertSchema(noteTags).pick({
  noteId: true,
  tagId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type NoteTag = typeof noteTags.$inferSelect;
export type InsertNoteTag = z.infer<typeof insertNoteTagSchema>;

// WebDAV config type
export const webdavConfigSchema = z.object({
  endpoint: z.string().url(),
  username: z.string().optional(),
  password: z.string().optional(),
  enabled: z.boolean().default(false),
});

export type WebDAVConfig = z.infer<typeof webdavConfigSchema>;
