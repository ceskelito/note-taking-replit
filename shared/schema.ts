import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  settings: jsonb("settings"),
  webdavUrl: text("webdav_url"),
  webdavUsername: text("webdav_username"),
  webdavPassword: text("webdav_password"),
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  preview: text("preview"),
  backgroundColor: text("background_color").default("#ffffff"),
  textColor: text("text_color").default("#000000"),
  fontFamily: text("font_family").default("Inter"),
  isPinned: boolean("is_pinned").default(false),
  folderId: integer("folder_id").references(() => folders.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("#3B82F6"),
  userId: integer("user_id").references(() => users.id),
});

export const noteTags = pgTable("note_tags", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").references(() => notes.id),
  tagId: integer("tag_id").references(() => tags.id),
});

// Schemas for inserts
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  settings: true,
  webdavUrl: true,
  webdavUsername: true,
  webdavPassword: true,
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  userId: true,
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  title: true,
  content: true,
  preview: true,
  backgroundColor: true,
  textColor: true,
  fontFamily: true,
  isPinned: true,
  folderId: true,
  userId: true,
});

export const insertTagSchema = createInsertSchema(tags).pick({
  name: true,
  color: true,
  userId: true,
});

export const insertNoteTagSchema = createInsertSchema(noteTags).pick({
  noteId: true,
  tagId: true,
});

// Types for inserts
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type InsertNoteTag = z.infer<typeof insertNoteTagSchema>;

// Types for selects
export type User = typeof users.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type NoteTag = typeof noteTags.$inferSelect;

// Expanded types with relationships
export type NoteWithTags = Note & {
  tags: Tag[];
};

export type FolderWithNotes = Folder & {
  notes: Note[];
};
