import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { FoldersPanel } from '@/components/sidebar/folders-panel';
import { NotesListPanel } from '@/components/sidebar/notes-list-panel';
import { NoteEditor } from '@/components/editor/note-editor';
import { useAuth } from '@/context/auth-context';
import { useNotes } from '@/hooks/use-notes';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';

export default function Home() {
  const { isMobile } = useMobile();
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { createNote } = useNotes();
  
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('All Notes');
  
  // Mobile navigation state
  const [showFolders, setShowFolders] = useState<boolean>(false);
  const [showNotesList, setShowNotesList] = useState<boolean>(!isMobile);
  const [showEditor, setShowEditor] = useState<boolean>(!isMobile);

  useEffect(() => {
    if (isMobile) {
      // On mobile, only show folders by default
      setShowFolders(true);
      setShowNotesList(false);
      setShowEditor(false);
    } else {
      // On desktop, show both panels
      setShowNotesList(true);
      setShowEditor(true);
    }
  }, [isMobile]);

  const handleFolderSelect = (folderId: number | null) => {
    setSelectedFolderId(folderId);
    setFilterTag(null);
    setShowPinnedOnly(false);
    setTitle(folderId ? 'Folder Notes' : 'All Notes');
    
    if (isMobile) {
      setShowFolders(false);
      setShowNotesList(true);
    }
  };

  const handleTagSelect = (tag: string) => {
    setFilterTag(tag);
    setSelectedFolderId(null);
    setShowPinnedOnly(false);
    setTitle(`#${tag}`);
    
    if (isMobile) {
      setShowFolders(false);
      setShowNotesList(true);
    }
  };

  const handleAllNotesSelect = () => {
    setSelectedFolderId(null);
    setFilterTag(null);
    setShowPinnedOnly(false);
    setTitle('All Notes');
    
    if (isMobile) {
      setShowFolders(false);
      setShowNotesList(true);
    }
  };

  const handlePinnedNotesSelect = () => {
    setSelectedFolderId(null);
    setFilterTag(null);
    setShowPinnedOnly(true);
    setTitle('Pinned Notes');
    
    if (isMobile) {
      setShowFolders(false);
      setShowNotesList(true);
    }
  };

  const handleNoteSelect = (noteId: number) => {
    setSelectedNoteId(noteId);
    
    if (isMobile) {
      setShowNotesList(false);
      setShowEditor(true);
    }
  };

  const handleCreateNote = async () => {
    // Create a new note with default values
    const newNote = await createNote({
      title: 'Untitled Note',
      content: '',
      folderId: selectedFolderId,
    });
    
    if (newNote) {
      setSelectedNoteId(newNote.id);
      
      if (isMobile) {
        setShowNotesList(false);
        setShowEditor(true);
      }
    }
  };

  const toggleFoldersPanel = () => {
    if (isMobile) {
      setShowFolders(!showFolders);
      setShowNotesList(false);
      setShowEditor(false);
    }
  };

  const handleMobileBack = () => {
    if (isMobile) {
      setShowEditor(false);
      setShowNotesList(true);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Mobile Navigation Header */}
      {isMobile && (
        <div className="h-14 bg-white border-b border-secondary flex items-center justify-between px-4 z-10">
          <Button variant="ghost" size="icon" onClick={toggleFoldersPanel}>
            <Menu className="h-6 w-6" />
          </Button>
          
          <h1 className="text-lg font-semibold">NoteCraft</h1>
          
          <Button variant="ghost" size="icon" onClick={handleCreateNote}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Button>
        </div>
      )}
      
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Folders Panel */}
        <FoldersPanel
          onFolderSelect={handleFolderSelect}
          onTagSelect={handleTagSelect}
          onAllNotesSelect={handleAllNotesSelect}
          onPinnedNotesSelect={handlePinnedNotesSelect}
          selectedFolderId={selectedFolderId}
          className={`w-64 ${isMobile ? 'fixed inset-0 z-30' : ''} ${
            showFolders ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out md:translate-x-0`}
          isMobile={isMobile}
          onMobileClose={() => setShowFolders(false)}
        />
        
        {/* Notes List Panel */}
        <NotesListPanel
          onNoteSelect={handleNoteSelect}
          selectedNoteId={selectedNoteId}
          folderId={selectedFolderId}
          filterTag={filterTag}
          showPinnedOnly={showPinnedOnly}
          title={title}
          className={`w-72 ${isMobile ? 'fixed inset-0 z-20' : ''} ${
            showNotesList ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out md:translate-x-0`}
          isMobile={isMobile}
          onCreateNote={handleCreateNote}
          onMobileClose={() => {
            setShowNotesList(false);
            setShowFolders(true);
          }}
        />
        
        {/* Note Editor Panel */}
        <div 
          className={`flex-1 ${isMobile ? 'fixed inset-0 z-10' : ''} ${
            showEditor ? 'translate-x-0' : 'translate-x-full'
          } transition-transform duration-300 ease-in-out md:translate-x-0`}
        >
          {selectedNoteId ? (
            <NoteEditor 
              noteId={selectedNoteId} 
              folderId={selectedFolderId}
              onNoteCreated={setSelectedNoteId} 
              isMobile={isMobile}
              onMobileBack={handleMobileBack}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
              <div className="text-center max-w-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-xl font-semibold mb-2">No note selected</h2>
                <p className="text-gray-500 mb-4">Select a note from the list or create a new one.</p>
                <Button onClick={handleCreateNote}>Create new note</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
