import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Note, InsertNote } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useStorage } from "./useStorage";

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const { toast } = useToast();
  const { storageType, syncNotes } = useStorage();
  
  // Fetch notes from API or local storage
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/notes'], 
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Initialize notes from the query data
  useEffect(() => {
    if (data) {
      setNotes(data);
      // Select the first note if none is selected
      if (!selectedNote && data.length > 0) {
        setSelectedNote(data[0]);
      }
    }
  }, [data]);
  
  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (noteData: InsertNote) => 
      apiRequest('POST', '/api/notes', noteData),
    onSuccess: async (response) => {
      const newNote = await response.json();
      setNotes(prev => [...prev, newNote]);
      setSelectedNote(newNote);
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      
      toast({
        title: "Note created",
        description: "Your note has been created successfully",
      });
      
      // Sync notes if using WebDAV or Supabase
      if (storageType !== 'local') {
        syncNotes();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to create note",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: (noteData: Note) => 
      apiRequest('PUT', `/api/notes/${noteData.id}`, noteData),
    onSuccess: async (response, variables) => {
      const updatedNote = await response.json();
      setNotes(prev => prev.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ));
      
      if (selectedNote?.id === updatedNote.id) {
        setSelectedNote(updatedNote);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      
      // Sync notes if using WebDAV or Supabase
      if (storageType !== 'local') {
        syncNotes();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to update note",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => 
      apiRequest('DELETE', `/api/notes/${noteId}`),
    onSuccess: async (_, noteId) => {
      setNotes(prev => prev.filter(note => note.id !== noteId));
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(notes.find(note => note.id !== noteId) || null);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      
      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully",
      });
      
      // Sync notes if using WebDAV or Supabase
      if (storageType !== 'local') {
        syncNotes();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to delete note",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Select a note
  const selectNote = (note: Note | null) => {
    setSelectedNote(note);
  };
  
  // Create a new note
  const createNote = (noteData: InsertNote): Note => {
    // For optimistic UI, create a temporary note with a unique negative ID
    const tempId = -Math.floor(Math.random() * 1000);
    const tempNote: Note = {
      id: tempId,
      title: noteData.title,
      content: noteData.content,
      folderId: noteData.folderId,
      userId: noteData.userId,
      pinned: noteData.pinned || false,
      color: noteData.color || null,
      font: noteData.font || 'Inter',
      fontSize: noteData.fontSize || '16px',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setNotes(prev => [...prev, tempNote]);
    setSelectedNote(tempNote);
    
    // Actually create the note in the backend
    createNoteMutation.mutate(noteData);
    
    return tempNote;
  };
  
  // Update a note
  const updateNote = (noteData: Note) => {
    // Optimistic update
    setNotes(prev => prev.map(note => 
      note.id === noteData.id ? { ...note, ...noteData } : note
    ));
    
    if (selectedNote?.id === noteData.id) {
      setSelectedNote({ ...selectedNote, ...noteData });
    }
    
    // Actually update the note in the backend
    updateNoteMutation.mutate(noteData);
  };
  
  // Delete a note
  const deleteNote = (noteId: number) => {
    deleteNoteMutation.mutate(noteId);
  };
  
  return {
    notes,
    selectedNote,
    isLoading,
    error,
    selectNote,
    createNote,
    updateNote,
    deleteNote,
  };
};
