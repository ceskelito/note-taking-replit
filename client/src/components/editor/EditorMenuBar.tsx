import { useState } from "react";
import { Note } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tag, Palette, MoreVertical, Trash2, Share, Printer, Download } from "lucide-react";

interface EditorMenuBarProps {
  note: Note;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: number) => void;
  onShowColorPicker: () => void;
}

const EditorMenuBar = ({
  note,
  onUpdateNote,
  onDeleteNote,
  onShowColorPicker
}: EditorMenuBarProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="ghost" 
        size="icon"
        className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100" 
        title="Tags"
      >
        <Tag className="h-5 w-5" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon"
        className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100" 
        title="Note Color"
        onClick={onShowColorPicker}
      >
        <Palette className="h-5 w-5" />
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100" 
            title="More Options"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="flex items-center">
            <Printer className="mr-2 h-4 w-4" /> Print
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center">
            <Download className="mr-2 h-4 w-4" /> Export
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center">
            <Share className="mr-2 h-4 w-4" /> Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="flex items-center text-red-500 focus:text-red-500"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the note "{note.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => onDeleteNote(note.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditorMenuBar;
