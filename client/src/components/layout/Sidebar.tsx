import { Folder, Tag } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FolderIcon, FolderPlus, Plus, Star, Inbox } from "lucide-react";

interface SidebarProps {
  folders: Folder[];
  tags: Tag[];
  selectedFolder: Folder | null;
  selectedTag: Tag | null;
  onSelectFolder: (folder: Folder | null) => void;
  onSelectTag: (tag: Tag | null) => void;
  onCreateFolder: () => void;
  onCreateNote: () => void;
  isVisible: boolean;
  onClose: () => void;
}

const Sidebar = ({
  folders,
  tags,
  selectedFolder,
  selectedTag,
  onSelectFolder,
  onSelectTag,
  onCreateFolder,
  onCreateNote,
  isVisible,
  onClose,
}: SidebarProps) => {
  // Create the "All Notes" virtual folder
  const allNotesFolder: Folder = {
    id: -1,
    name: "All Notes",
    userId: null,
    color: null,
    createdAt: new Date(),
  };

  // Create the "Favorites" virtual folder
  const favoritesFolder: Folder = {
    id: -2,
    name: "Favorites",
    userId: null,
    color: null,
    createdAt: new Date(),
  };

  const getFolderIcon = (folder: Folder) => {
    if (folder.id === -1) return <Inbox className="mr-2 h-4 w-4" />;
    if (folder.id === -2) return <Star className="mr-2 h-4 w-4 text-yellow-400" />;
    
    return (
      <FolderIcon 
        className={cn(
          "mr-2 h-4 w-4", 
          folder.color === "yellow" && "text-yellow-400",
          folder.color === "blue" && "text-blue-400",
          folder.color === "green" && "text-green-400",
          folder.color === "purple" && "text-purple-400",
          folder.color === "pink" && "text-pink-400",
          !folder.color && "text-gray-400"
        )} 
      />
    );
  };
  
  return (
    <aside 
      className={cn(
        "w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform md:translate-x-0 absolute md:relative z-10 h-full",
        isVisible ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Folders</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-1 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100" 
            title="New Folder"
            onClick={onCreateFolder}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1">
        <ul className="py-2">
          <li>
            <button 
              onClick={() => onSelectFolder(allNotesFolder)} 
              className={cn(
                "flex items-center w-full px-4 py-2 text-left",
                selectedFolder?.id === -1 
                  ? "text-gray-900 bg-gray-100 border-l-4 border-primary" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Inbox className="mr-2 h-4 w-4" /> All Notes
              <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
                {folders.reduce((count, folder) => {
                  // Count notes in each folder and add to total
                  return count + (folder.notesCount || 0);
                }, 0)}
              </span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => onSelectFolder(favoritesFolder)} 
              className={cn(
                "flex items-center w-full px-4 py-2 text-left",
                selectedFolder?.id === -2 
                  ? "text-gray-900 bg-gray-100 border-l-4 border-primary" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Star className="mr-2 h-4 w-4 text-yellow-400" /> Favorites
              <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
                {/* Count of pinned notes */}
                {folders.reduce((count, folder) => {
                  // Count pinned notes in each folder and add to total
                  return count + (folder.pinnedNotesCount || 0);
                }, 0)}
              </span>
            </button>
          </li>
          
          {folders.filter(f => f.id > 0).map((folder) => (
            <li key={folder.id}>
              <button 
                onClick={() => onSelectFolder(folder)} 
                className={cn(
                  "flex items-center w-full px-4 py-2 text-left",
                  selectedFolder?.id === folder.id 
                    ? "text-gray-900 bg-gray-100 border-l-4 border-primary" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {getFolderIcon(folder)} {folder.name}
                <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
                  {folder.notesCount || 0}
                </span>
              </button>
            </li>
          ))}
        </ul>
        
        <div className="px-4 pt-4 pb-2">
          <h3 className="font-medium text-gray-500 text-sm uppercase tracking-wider">Tags</h3>
        </div>
        
        <ul className="px-2 py-1">
          {tags.map((tag) => (
            <li key={tag.id}>
              <button 
                onClick={() => onSelectTag(tag)} 
                className={cn(
                  "flex items-center w-full px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded text-left",
                  selectedTag?.id === tag.id && "bg-gray-100"
                )}
              >
                <span 
                  className={cn(
                    "w-2 h-2 rounded-full mr-2",
                    tag.color === "red" && "bg-red-500",
                    tag.color === "blue" && "bg-blue-500",
                    tag.color === "green" && "bg-green-500",
                    tag.color === "yellow" && "bg-yellow-500",
                    tag.color === "purple" && "bg-purple-500",
                    tag.color === "pink" && "bg-pink-500",
                    !tag.color && "bg-gray-500"
                  )}
                ></span>
                {tag.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <Button 
          onClick={onCreateNote}
          className="flex items-center justify-center w-full"
        >
          <Plus className="mr-2 h-4 w-4" /> New Note
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
