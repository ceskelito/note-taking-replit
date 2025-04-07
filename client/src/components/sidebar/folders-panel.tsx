import { useState } from "react";
import { Folder, Pencil, Plus, Settings, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFolders } from "@/hooks/use-folders";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Badge } from "../ui/badge";
import { useTags } from "@/hooks/use-tags";
import { useNotes } from "@/hooks/use-notes";

export type FoldersListProps = {
  onFolderSelect: (id: number | null) => void;
  onTagSelect: (tag: string) => void;
  onAllNotesSelect: () => void;
  onPinnedNotesSelect: () => void;
  selectedFolderId: number | null;
  className?: string;
  isMobile?: boolean;
  onMobileClose?: () => void;
};

export function FoldersPanel({
  onFolderSelect,
  onTagSelect,
  onAllNotesSelect,
  onPinnedNotesSelect,
  selectedFolderId,
  className = "",
  isMobile = false,
  onMobileClose,
}: FoldersListProps) {
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { folders, createFolder, isCreatingFolder, isLoading: isFoldersLoading } = useFolders();
  const { tags, isLoading: isTagsLoading } = useTags();
  const { notes } = useNotes();
  const [newFolderName, setNewFolderName] = useState("");
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);

  const pinnedNotes = notes?.filter((note) => note.isPinned) || [];

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    await createFolder({ name: newFolderName });
    setNewFolderName("");
    setIsNewFolderDialogOpen(false);
  };

  return (
    <div className={`h-full bg-white border-r border-secondary flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-secondary">
        <h1 className="text-xl font-semibold text-neutral-dark">NoteCraft</h1>
        <div className="flex space-x-2">
          <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="New Folder">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                />
                <Button 
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || isCreatingFolder}
                  className="w-full"
                >
                  Create Folder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="px-2 py-3">
        <div className="flex items-center rounded-md bg-gray-100 px-2 py-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input 
            type="text" 
            placeholder="Search notes..." 
            className="w-full bg-transparent border-none text-sm focus:outline-none px-2 py-1 h-auto"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-1">
        <div 
          className={`flex items-center justify-between px-4 py-2 rounded-md cursor-pointer ${selectedFolderId === null ? 'bg-blue-50 border-l-4 border-primary' : 'hover:bg-gray-100'}`}
          onClick={() => {
            onAllNotesSelect();
            if (isMobile && onMobileClose) onMobileClose();
          }}
        >
          <div className="flex items-center">
            <Folder className="h-5 w-5 mr-2 text-primary" />
            <span>All Notes</span>
          </div>
          <span className="text-xs text-gray-500">{notes?.length || 0}</span>
        </div>

        <div 
          className="flex items-center justify-between px-4 py-2 rounded-md cursor-pointer hover:bg-gray-100"
          onClick={() => {
            onPinnedNotesSelect();
            if (isMobile && onMobileClose) onMobileClose();
          }}
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>Pinned</span>
          </div>
          <span className="text-xs text-gray-500">{pinnedNotes.length}</span>
        </div>

        <div className="px-4 pt-6 pb-2">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Folders</h3>
        </div>

        <div className="space-y-1">
          {isFoldersLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading folders...</div>
          ) : folders && folders.length > 0 ? (
            folders.map((folder) => (
              <div
                key={folder.id}
                className={`flex items-center justify-between px-4 py-2 rounded-md cursor-pointer ${selectedFolderId === folder.id ? 'bg-blue-50 border-l-4 border-primary' : 'hover:bg-gray-100'}`}
                onClick={() => {
                  onFolderSelect(folder.id);
                  if (isMobile && onMobileClose) onMobileClose();
                }}
              >
                <div className="flex items-center">
                  <Folder className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{folder.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">
                    {notes?.filter(note => note.folderId === folder.id).length || 0}
                  </span>
                  {/* Folder edit/delete options would go here */}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No folders</div>
          )}
        </div>

        <div className="px-4 pt-6 pb-2">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Tags</h3>
        </div>

        <div className="px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {isTagsLoading ? (
              <div className="text-sm text-gray-500">Loading tags...</div>
            ) : tags && tags.length > 0 ? (
              tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="px-2 py-1 rounded-full text-xs cursor-pointer hover:bg-blue-50"
                  style={{ 
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    borderColor: tag.color
                  }}
                  onClick={() => {
                    onTagSelect(tag.name);
                    if (isMobile && onMobileClose) onMobileClose();
                  }}
                >
                  #{tag.name}
                </Badge>
              ))
            ) : (
              <div className="text-sm text-gray-500">No tags</div>
            )}
          </div>
        </div>

        <div className="mt-8 px-4 pb-6">
          <div className="border-t border-gray-200 pt-4">
            {isAuthenticated ? (
              <Button 
                variant="ghost" 
                className="flex items-center text-sm text-gray-600 hover:text-primary px-0"
                onClick={logout}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="ghost" className="flex items-center text-sm text-gray-600 hover:text-primary px-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </ScrollArea>

      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4" 
          onClick={onMobileClose}
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
