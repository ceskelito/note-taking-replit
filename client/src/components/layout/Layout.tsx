import { useState } from "react";
import Sidebar from "./Sidebar";
import NotesList from "./NotesList";
import Editor from "../editor/Editor";
import { useNotes } from "@/lib/hooks/useNotes";
import { useFolders } from "@/lib/hooks/useFolders";
import { useTags } from "@/lib/hooks/useTags";
import LoginDialog from "../dialogs/LoginDialog";
import WebDAVConfigDialog from "../dialogs/WebDAVConfigDialog";
import { Folder, Note, Tag } from "@shared/schema";
import { FolderPlus, Search, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useStorage } from "@/lib/hooks/useStorage";
import CreateFolderDialog from "../dialogs/CreateFolderDialog";

const Layout = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNotesList, setShowNotesList] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showWebDAVDialog, setShowWebDAVDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState(false);
  
  const { selectedFolder, selectFolder, folders } = useFolders();
  const { selectedTag, selectTag, tags } = useTags();
  const { selectedNote, selectNote, notes, createNote, updateNote, deleteNote } = useNotes();
  const { storageType, user } = useStorage();
  
  // Calculate notes to display based on selected folder/tag and search query
  const getDisplayNotes = (): Note[] => {
    let filteredNotes = notes;
    
    // Filter by folder
    if (selectedFolder && selectedFolder.id !== -1) {
      filteredNotes = filteredNotes.filter(note => note.folderId === selectedFolder.id);
    }
    
    // Filter by tag if tag is selected
    if (selectedTag) {
      filteredNotes = filteredNotes.filter(note => 
        note.tags?.some(tag => tag.id === selectedTag.id)
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.title.toLowerCase().includes(query) || 
        note.content.toLowerCase().includes(query)
      );
    }
    
    return filteredNotes;
  };
  
  const handleNewNote = () => {
    const newNote = createNote({
      title: "Untitled Note",
      content: "",
      folderId: selectedFolder ? selectedFolder.id : undefined,
      userId: user ? user.id : undefined,
      pinned: false,
      color: undefined,
      font: "Inter",
      fontSize: "16px",
    });
    
    selectNote(newNote);
  };
  
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => setShowSidebar(!showSidebar)} 
            className="md:hidden mr-4 text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex items-center">
            <svg className="w-8 h-8 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
            </svg>
            <h1 className="text-xl font-semibold text-gray-800">NoteKeeper</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button 
              onClick={() => setShowSearch(!showSearch)} 
              className="p-2 text-gray-600 rounded-full hover:bg-gray-100"
            >
              <Search className="h-5 w-5" />
            </button>
            {showSearch && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                <div className="p-2">
                  <input 
                    type="text" 
                    placeholder="Search notes..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                {searchQuery && (
                  <div className="max-h-64 overflow-y-auto">
                    {getDisplayNotes().map(note => (
                      <div 
                        key={note.id} 
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          selectNote(note);
                          setSearchQuery("");
                          setShowSearch(false);
                        }}
                      >
                        <p className="font-medium">{note.title}</p>
                        <p className="text-sm text-gray-600 truncate">
                          {note.content.replace(/<[^>]+>/g, ' ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <Button variant="ghost" size="icon" className="p-2 text-gray-600 rounded-full hover:bg-gray-100">
            <Settings className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="p-3 border-b border-gray-200">
                <p className="font-medium">{user ? user.email : "Guest User"}</p>
                <p className="text-sm text-gray-600">Using {storageType} storage</p>
              </div>
              <DropdownMenuItem onClick={() => setShowLoginDialog(true)}>
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                {user ? "Sign Out" : "Sign In"}
              </DropdownMenuItem>
              {!user && (
                <DropdownMenuItem onClick={() => setShowLoginDialog(true)}>
                  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  Create Account
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowWebDAVDialog(true)}>
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Configure WebDAV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          folders={folders}
          tags={tags}
          selectedFolder={selectedFolder}
          selectedTag={selectedTag}
          onSelectFolder={selectFolder}
          onSelectTag={selectTag}
          onCreateFolder={() => setShowCreateFolderDialog(true)}
          onCreateNote={handleNewNote}
          isVisible={showSidebar}
          onClose={() => setShowSidebar(false)}
        />
        
        {/* Overlay to close sidebar on mobile */}
        {showSidebar && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-30 z-0"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Notes List */}
        <NotesList 
          notes={getDisplayNotes()}
          selectedNote={selectedNote}
          onSelectNote={selectNote}
          onCreateNote={handleNewNote}
          title={selectedFolder ? selectedFolder.name : "All Notes"}
          isVisible={showNotesList}
          onClose={() => setShowNotesList(false)}
        />

        {/* Note Editor */}
        <Editor 
          note={selectedNote}
          onUpdateNote={updateNote}
          onDeleteNote={deleteNote}
          onToggleNotesList={() => setShowNotesList(!showNotesList)}
        />
      </main>
      
      {/* Dialogs */}
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog}
      />
      
      <WebDAVConfigDialog 
        open={showWebDAVDialog} 
        onOpenChange={setShowWebDAVDialog}
      />
      
      <CreateFolderDialog 
        open={showCreateFolderDialog} 
        onOpenChange={setShowCreateFolderDialog}
      />
    </div>
  );
};

export default Layout;
