import { Note } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, Plus, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import { FolderIcon } from "lucide-react";

interface NotesListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  title: string;
  isVisible: boolean;
  onClose: () => void;
}

const NotesList = ({
  notes,
  selectedNote,
  onSelectNote,
  onCreateNote,
  title,
  isVisible,
  onClose,
}: NotesListProps) => {
  // Sort notes by pinned status and then by updated date
  const sortedNotes = [...notes].sort((a, b) => {
    // First by pinned status
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    // Then by updated date (most recent first)
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  
  return (
    <div className={cn(
      "w-72 border-r border-gray-200 bg-white flex flex-col",
      isVisible ? "block" : "hidden md:flex"
    )}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{notes.length} notes</p>
        </div>
        <div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100" 
            title="Sort"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
            </svg>
          </Button>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1">
        {sortedNotes.map((note) => (
          <div 
            key={note.id}
            onClick={() => onSelectNote(note)}
            className={cn(
              "border-b border-gray-200 p-3 cursor-pointer",
              selectedNote?.id === note.id ? "bg-blue-50" : "hover:bg-gray-50",
              note.color && `bg-note-${note.color}/10`
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{note.title}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {/* Strip HTML tags from content for display */}
                  {note.content.replace(/<[^>]+>/g, ' ')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "text-gray-400 hover:text-gray-600",
                  note.pinned && "text-yellow-500"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNote({
                    ...note,
                    pinned: !note.pinned
                  });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.6 4.5a1.5 1.5 0 0 0-2.7 0l-.1.1-.2.6c-.1.2-.3.5-.6.7-.3.3-.6.4-.9.5h-.2L4 7v.2c0 .4.1.8.4 1.1l.2.2 4.7 4.7 4.7-4.7.2-.2c.3-.3.4-.7.4-1.1V7l-.9-.5h-.2a2.9 2.9 0 0 1-.9-.5c-.3-.2-.5-.5-.6-.7l-.2-.6-.1-.1a1.5 1.5 0 0 0-2.1-.1z" />
                </svg>
              </Button>
            </div>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <span>{format(new Date(note.updatedAt), 'MMM d, yyyy')}</span>
              {note.folderId && note.folder && (
                <>
                  <span className="mx-2">•</span>
                  <span className="flex items-center">
                    <FolderIcon className={cn(
                      "mr-1 h-3 w-3",
                      note.folder.color === "yellow" && "text-yellow-400",
                      note.folder.color === "blue" && "text-blue-400",
                      note.folder.color === "green" && "text-green-400",
                      note.folder.color === "purple" && "text-purple-400",
                      note.folder.color === "pink" && "text-pink-400",
                      !note.folder.color && "text-gray-400"
                    )} />
                    {note.folder.name}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}

        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 text-center h-40">
            <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No notes found</p>
            <Button 
              variant="link" 
              onClick={onCreateNote}
              className="mt-2"
            >
              Create a new note
            </Button>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <Button 
          onClick={onCreateNote}
          className="flex items-center justify-center w-full"
        >
          <Plus className="mr-2 h-4 w-4" /> New Note
        </Button>
      </div>
    </div>
  );
};

export default NotesList;
