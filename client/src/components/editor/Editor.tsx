import { useEffect, useState, useRef } from "react";
import { Note } from "@shared/schema";
import EditorMenuBar from "./EditorMenuBar";
import TextFormatMenu from "./TextFormatMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTags } from "@/lib/hooks/useTags";
import { useFolders } from "@/lib/hooks/useFolders";
import { useEditor } from "@/lib/hooks/useEditor";
import { EditorContent } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { ChevronLeft, FileStack, Info } from "lucide-react";
import { format } from "date-fns";
import ColorPickerDialog from "../dialogs/ColorPickerDialog";

interface EditorProps {
  note: Note | null;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: number) => void;
  onToggleNotesList: () => void;
}

const Editor = ({ note, onUpdateNote, onDeleteNote, onToggleNotesList }: EditorProps) => {
  const [title, setTitle] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const { folders } = useFolders();
  const { tags } = useTags();
  
  const { editor, isEditorReady, formatText, handleTextSelection, showFormatMenu, setShowFormatMenu, menuPosition } = useEditor({
    content: note?.content || "",
    onUpdate: (newContent) => {
      if (note) {
        onUpdateNote({
          ...note,
          content: newContent,
          updatedAt: new Date(),
        });
      }
    },
  });
  
  // Update title state when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
    }
  }, [note?.id, note?.title]);
  
  // Update note when title changes
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (note) {
      onUpdateNote({
        ...note,
        title: newTitle,
        updatedAt: new Date(),
      });
    }
  };
  
  // Handle note color change
  const handleColorChange = (color: string | null) => {
    if (note) {
      onUpdateNote({
        ...note,
        color,
        updatedAt: new Date(),
      });
      setShowColorPicker(false);
    }
  };
  
  // Calculate the time since last update
  const getTimeAgo = () => {
    if (!note) return "";
    
    const now = new Date();
    const updated = new Date(note.updatedAt);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return format(updated, 'MMM d, yyyy');
  };
  
  // Count words in the content
  const getWordCount = () => {
    if (!note) return 0;
    const text = note.content.replace(/<[^>]+>/g, ' ');
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };
  
  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">No Note Selected</h3>
          <p className="max-w-sm mx-auto">Select a note from the list or create a new one to get started.</p>
        </div>
      </div>
    );
  }
  
  const noteBackground = note.color 
    ? `bg-note-${note.color}/20` 
    : "bg-white";
  
  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleNotesList} 
            className="md:hidden mr-3 text-gray-600 hover:text-gray-900 p-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="border-0 bg-transparent font-semibold text-xl text-gray-900 focus:outline-none focus:ring-0 shadow-none p-0 h-auto"
            placeholder="Note title..."
          />
        </div>
        <EditorMenuBar 
          note={note}
          onUpdateNote={onUpdateNote}
          onDeleteNote={onDeleteNote}
          onShowColorPicker={() => setShowColorPicker(true)}
        />
      </div>
      
      <div 
        className={cn(
          "flex-1 overflow-y-auto p-6", 
          noteBackground
        )} 
        onMouseUp={handleTextSelection}
        onKeyUp={handleTextSelection}
      >
        {/* Text formatting menu that appears on selection */}
        {showFormatMenu && (
          <TextFormatMenu
            position={menuPosition}
            onFormat={formatText}
            onClose={() => setShowFormatMenu(false)}
          />
        )}
        
        {/* Editor content */}
        <div className="editor-content h-full focus:outline-none">
          {editor && (
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-full">
              {editor}
            </div>
          )}
          
          {!isEditorReady && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>
      
      <div className="border-t border-gray-200 p-3 bg-white flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-500">
          <span>Edited {getTimeAgo()}</span>
          <span className="mx-2">•</span>
          <Button variant="ghost" size="sm" className="p-0 text-gray-600 hover:text-gray-900 h-auto">
            <FileStack className="mr-1 h-4 w-4" /> History
          </Button>
        </div>
        <div className="flex items-center">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-gray-900 p-2 flex items-center rounded hover:bg-gray-100 h-auto"
              onClick={() => setShowInfoTooltip(!showInfoTooltip)}
            >
              <Info className="mr-1 h-4 w-4" />
              <span className="text-sm">Info</span>
            </Button>
            {showInfoTooltip && (
              <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm z-10">
                <p className="font-medium mb-2">Note Details</p>
                <p className="text-gray-600 mb-1">Created: {format(new Date(note.createdAt), 'MMM d, yyyy')}</p>
                <p className="text-gray-600 mb-1">Modified: {format(new Date(note.updatedAt), 'MMM d, yyyy')}</p>
                <p className="text-gray-600 mb-1">Word count: {getWordCount()}</p>
                <p className="text-gray-600">Storage: Local</p>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-600 hover:text-gray-900 p-2 flex items-center rounded hover:bg-gray-100 h-auto"
          >
            <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V17a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm9.5 2A1.5 1.5 0 009 8.5v2a1.5 1.5 0 003 0v-2A1.5 1.5 0 0010.5 7z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{note.folder?.name || "No folder"}</span>
          </Button>
        </div>
      </div>
      
      <ColorPickerDialog 
        open={showColorPicker}
        onOpenChange={setShowColorPicker}
        selectedColor={note.color || null}
        onSelectColor={handleColorChange}
      />
    </div>
  );
};

export default Editor;
