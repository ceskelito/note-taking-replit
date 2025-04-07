import { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/hooks/use-notes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { type Note } from '@shared/schema';

export type NotesListPanelProps = {
  onNoteSelect: (id: number) => void;
  selectedNoteId: number | null;
  folderId: number | null;
  filterTag: string | null;
  showPinnedOnly: boolean;
  title: string;
  className?: string;
  isMobile?: boolean;
  onCreateNote: () => void;
  onMobileClose?: () => void;
};

export function NotesListPanel({
  onNoteSelect,
  selectedNoteId,
  folderId,
  filterTag,
  showPinnedOnly,
  title,
  className = "",
  isMobile = false,
  onCreateNote,
  onMobileClose,
}: NotesListPanelProps) {
  const { notes, isLoading, error } = useNotes();
  const [sortBy, setSortBy] = useState<'recent' | 'modified' | 'created'>('recent');

  // Filter and sort notes
  const filteredNotes = notes?.filter((note) => {
    // First filter by folder if specified
    if (folderId !== null && note.folderId !== folderId) {
      return false;
    }
    
    // Then filter by tag if specified
    if (filterTag && !note.tags?.some(tag => tag.name === filterTag)) {
      return false;
    }
    
    // Then filter by pinned status if specified
    if (showPinnedOnly && !note.isPinned) {
      return false;
    }
    
    return true;
  }) || [];

  // Sort notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'modified' || sortBy === 'recent') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else if (sortBy === 'created') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  function getPreviewText(note: Note) {
    if (note.preview) return note.preview;
    
    // If no preview, try to extract from content
    // This is a simple implementation - in a real app, you'd want to properly
    // strip HTML/markdown and get clean text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.substring(0, 100);
  }

  return (
    <div className={`h-full bg-white border-r border-secondary flex flex-col ${className}`}>
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="text-lg font-medium">{title}</h2>
          <Button onClick={onCreateNote} variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex px-4 pb-3">
          <Button 
            variant={sortBy === 'recent' ? 'default' : 'ghost'} 
            size="sm"
            className={sortBy === 'recent' ? 'text-primary' : 'text-gray-500'}
            onClick={() => setSortBy('recent')}
          >
            Recent
          </Button>
          <Button 
            variant={sortBy === 'modified' ? 'default' : 'ghost'} 
            size="sm"
            className={sortBy === 'modified' ? 'text-primary' : 'text-gray-500'}
            onClick={() => setSortBy('modified')}
          >
            Modified
          </Button>
          <Button 
            variant={sortBy === 'created' ? 'default' : 'ghost'} 
            size="sm"
            className={sortBy === 'created' ? 'text-primary' : 'text-gray-500'}
            onClick={() => setSortBy('created')}
          >
            Created
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center">Loading notes...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 flex flex-col items-center">
            <AlertCircle className="h-6 w-6 mb-2" />
            <p>Error loading notes</p>
          </div>
        ) : sortedNotes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="mb-4">No notes found</p>
            <Button onClick={onCreateNote}>Create your first note</Button>
          </div>
        ) : (
          <div>
            {sortedNotes.map((note) => (
              <div 
                key={note.id} 
                className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all ${
                  selectedNoteId === note.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  onNoteSelect(note.id);
                  if (isMobile && onMobileClose) onMobileClose();
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-neutral-dark">{note.title}</h3>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {getPreviewText(note)}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {note.tags?.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{ 
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          borderColor: tag.color
                        }}
                      >
                        #{tag.name}
                      </Badge>
                    ))}
                  </div>
                  {note.isPinned && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {isMobile && (
        <Button
          variant="ghost"
          className="absolute top-4 right-4"
          onClick={onMobileClose}
        >
          Back
        </Button>
      )}
    </div>
  );
}
