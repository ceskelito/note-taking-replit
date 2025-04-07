import { User, Note, Folder, Tag, NoteTag, WebDAVConfig } from "@shared/schema";

// Export the types from shared/schema.ts for easier access
export type { User, Note, Folder, Tag, NoteTag, WebDAVConfig };

// Define additional types specific to the frontend

// Response types for API calls
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

// Context menu position type
export interface ContextMenuPosition {
  x: number;
  y: number;
}

// Storage configuration
export interface StorageConfig {
  type: "local" | "webdav" | "supabase";
  webdav?: WebDAVConfig;
  user?: User;
}

// Editor state
export interface EditorState {
  isFocused: boolean;
  isEditing: boolean;
  selectedText: string;
  selectionRange: Range | null;
}

// Font options
export interface FontOption {
  name: string;
  label: string;
  className: string;
}

// Font size options
export interface FontSizeOption {
  size: string;
  label: string;
}

// Note with extended properties
export interface NoteWithRelations extends Note {
  folder?: Folder;
  tags?: Tag[];
}

// Color option
export interface ColorOption {
  id: string;
  name: string;
  value: string;
  className: string;
}

// Note colors
export const NOTE_COLORS: ColorOption[] = [
  { id: "", name: "None", value: "transparent", className: "bg-white border-2 border-gray-300" },
  { id: "yellow", name: "Yellow", value: "hsl(var(--note-yellow))", className: "bg-note-yellow" },
  { id: "blue", name: "Blue", value: "hsl(var(--note-blue))", className: "bg-note-blue" },
  { id: "green", name: "Green", value: "hsl(var(--note-green))", className: "bg-note-green" },
  { id: "pink", name: "Pink", value: "hsl(var(--note-pink))", className: "bg-note-pink" },
  { id: "purple", name: "Purple", value: "hsl(var(--note-purple))", className: "bg-note-purple" },
  { id: "orange", name: "Orange", value: "hsl(var(--note-orange))", className: "bg-note-orange" },
];

// Font options
export const FONT_OPTIONS: FontOption[] = [
  { name: "Inter", label: "Inter", className: "font-sans" },
  { name: "Serif", label: "Serif", className: "font-serif" },
  { name: "Mono", label: "Monospace", className: "font-mono" },
];

// Font size options
export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { size: "12px", label: "Small" },
  { size: "16px", label: "Medium" },
  { size: "20px", label: "Large" },
  { size: "24px", label: "X-Large" },
];
