import { useState } from 'react';
import { 
  Save, 
  ChevronRight, 
  Share, 
  MoreVertical, 
  Bookmark,
  ChevronLeft, 
  Trash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/hooks/use-notes';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type NoteToolbarProps = {
  noteId: number | null;
  folderName: string;
  title: string;
  isMobile?: boolean;
  onMobileBack?: () => void;
  onSave: () => void;
};

export function NoteToolbar({ 
  noteId, 
  folderName, 
  title,
  isMobile = false,
  onMobileBack,
  onSave
}: NoteToolbarProps) {
  const { updateNote, deleteNote, getNote } = useNotes();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleTogglePin = async () => {
    if (!noteId) return;
    
    const note = getNote(noteId);
    if (!note) return;
    
    await updateNote({
      id: noteId,
      isPinned: !note.isPinned
    });
  };

  const handleDeleteNote = async () => {
    if (!noteId) return;
    
    await deleteNote(noteId);
    setIsDeleteDialogOpen(false);
    
    if (onMobileBack) {
      onMobileBack();
    }
  };

  const isPinned = noteId ? getNote(noteId)?.isPinned : false;

  return (
    <div className="border-b border-gray-200 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {isMobile && onMobileBack && (
          <Button variant="ghost" size="icon" className="mr-2" onClick={onMobileBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">{folderName}</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700 ml-2 line-clamp-1">{title || "Untitled"}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={onSave}
          title="Save"
        >
          <Save className="h-5 w-5" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={handleTogglePin}
          title={isPinned ? "Unpin" : "Pin"}
        >
          <Bookmark className={`h-5 w-5 ${isPinned ? 'text-amber-500 fill-amber-500' : ''}`} />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="flex items-center cursor-pointer" 
              onClick={onSave}
            >
              <Save className="h-4 w-4 mr-2" />
              <span>Save</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className="flex items-center cursor-pointer" 
              onClick={handleTogglePin}
            >
              <Bookmark className={`h-4 w-4 mr-2 ${isPinned ? 'text-amber-500 fill-amber-500' : ''}`} />
              <span>{isPinned ? "Unpin" : "Pin note"}</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem 
                  className="flex items-center cursor-pointer text-red-500" 
                  onSelect={(e) => {
                    e.preventDefault();
                  }}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  <span>Delete note</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the note.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteNote}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
