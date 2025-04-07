import { useState, useEffect } from 'react';
import { useEditor } from '@/hooks/use-editor';
import { useNotes } from '@/hooks/use-notes';
import { useTags } from '@/hooks/use-tags';
import { useFolders } from '@/hooks/use-folders';
import { NoteToolbar } from './note-toolbar';
import { TextEditor } from './text-editor';
import { FormatMenu } from './format-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, ChevronLeft, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export type NoteEditorProps = {
  noteId: number | null;
  folderId: number | null;
  onNoteCreated: (id: number) => void;
  isMobile?: boolean;
  onMobileBack?: () => void;
};

export function NoteEditor({ 
  noteId, 
  folderId,
  onNoteCreated,
  isMobile = false,
  onMobileBack 
}: NoteEditorProps) {
  const { getNote, updateNote, createNote, isLoading, error } = useNotes();
  const { folders } = useFolders();
  const { tags, createTag } = useTags();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [isNewTagDialogOpen, setIsNewTagDialogOpen] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [formatMenuPosition, setFormatMenuPosition] = useState({ x: 0, y: 0 });
  const { editor, handleSelectionChange } = useEditor({
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
      // Auto-save changes
      if (noteId) {
        updateNote({
          id: noteId,
          content: editor.getHTML(),
          preview: editor.getText().substring(0, 100),
        });
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        // Text is selected, show format menu
        const view = editor.view;
        const { top, left, height } = view.coordsAtPos(from);
        setFormatMenuPosition({ x: left, y: top - height - 10 });
        setShowFormatMenu(true);
      } else {
        setShowFormatMenu(false);
      }
    }
  });

  // Load note data when noteId changes
  useEffect(() => {
    if (noteId) {
      const note = getNote(noteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setSelectedFolder(note.folderId);
        setSelectedTags(note.tags?.map(tag => tag.id) || []);
        
        // Update editor content
        if (editor) {
          editor.commands.setContent(note.content);
        }
      }
    } else {
      // Clear the editor for new note
      setTitle('');
      setContent('');
      setSelectedFolder(folderId);
      setSelectedTags([]);
      
      if (editor) {
        editor.commands.clearContent();
      }
    }
  }, [noteId, getNote, editor, folderId]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (noteId) {
      updateNote({
        id: noteId,
        title: e.target.value,
      });
    }
  };

  const handleSaveNote = async () => {
    if (!title.trim()) return;
    
    if (noteId) {
      await updateNote({
        id: noteId,
        title,
        content,
        folderId: selectedFolder,
        preview: content.substring(0, 100).replace(/<[^>]*>/g, ''),
      });
    } else {
      const newNote = await createNote({
        title,
        content,
        folderId: selectedFolder,
        preview: content.substring(0, 100).replace(/<[^>]*>/g, ''),
      });
      
      if (newNote) {
        onNoteCreated(newNote.id);
      }
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    const newTag = await createTag({
      name: newTagName,
      color: newTagColor,
    });
    
    if (newTag) {
      setSelectedTags([...selectedTags, newTag.id]);
      setNewTagName('');
      setIsNewTagDialogOpen(false);
    }
  };

  const toggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
    
    if (noteId) {
      // In a real app, you'd update the note-tag relationship in the backend
      // For simplicity, we're just updating the UI state here
    }
  };

  const getCurrentFolder = () => {
    if (!selectedFolder) return null;
    return folders?.find(folder => folder.id === selectedFolder);
  };

  if (isLoading && noteId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500">Loading note...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-500">
          <AlertCircle className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium">Error loading note</h3>
          <p className="mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const currentNote = noteId ? getNote(noteId) : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white h-full">
      {/* Note Toolbar */}
      <NoteToolbar 
        noteId={noteId}
        folderName={getCurrentFolder()?.name || 'No folder'}
        title={title}
        isMobile={isMobile}
        onMobileBack={onMobileBack}
        onSave={handleSaveNote}
      />
      
      {/* Editor Area */}
      <ScrollArea className="flex-1 px-6 py-4">
        {/* Note Title */}
        <div className="mb-4">
          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title"
            className="text-3xl font-serif font-bold border-none px-0 focus-visible:ring-0 h-auto"
          />
        </div>

        {/* Tags */}
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          {tags?.filter(tag => selectedTags.includes(tag.id)).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="px-2 py-1 rounded-full text-xs cursor-pointer"
              style={{ 
                backgroundColor: `${tag.color}20`,
                color: tag.color,
                borderColor: tag.color
              }}
              onClick={() => toggleTag(tag.id)}
            >
              #{tag.name}
            </Badge>
          ))}
          
          <Dialog open={isNewTagDialogOpen} onOpenChange={setIsNewTagDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="px-2 py-1 h-auto text-xs text-gray-500 hover:text-primary flex items-center"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <Input
                      placeholder="Tag name"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="h-10 p-1 cursor-pointer"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="w-full"
                >
                  Create Tag
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Note Content */}
        <div className="py-2">
          <TextEditor 
            editor={editor} 
            onSelectionChange={handleSelectionChange} 
          />
        </div>
        
        {/* Format Menu (only visible when text is selected) */}
        {showFormatMenu && editor && (
          <FormatMenu 
            editor={editor} 
            position={formatMenuPosition} 
            onClose={() => setShowFormatMenu(false)} 
          />
        )}
      </ScrollArea>

      {/* Note Footer */}
      {currentNote && (
        <div className="border-t border-gray-200 p-3 flex items-center justify-between text-sm text-gray-500">
          <div>Last edited: {formatDistanceToNow(new Date(currentNote.updatedAt), { addSuffix: true })}</div>
          <div>Saved in: {getCurrentFolder()?.name || 'No folder'}</div>
        </div>
      )}
    </div>
  );
}
