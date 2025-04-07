import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/auth-context';
import { useStorage } from '@/context/storage-context';
import { useLocalDb } from '@/lib/db';
import { type Note, type NoteWithTags, type InsertNote } from '@shared/schema';
import { useToast } from './use-toast';

export interface NotesHook {
  notes: NoteWithTags[] | undefined;
  getNote: (id: number) => NoteWithTags | undefined;
  createNote: (note: Partial<InsertNote>) => Promise<Note | undefined>;
  updateNote: (note: Partial<Note> & { id: number }) => Promise<Note | undefined>;
  deleteNote: (id: number) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
}

export function useNotes(): NotesHook {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { storageType } = useStorage();
  const localDb = useLocalDb();
  
  // Determine if we should fetch from API or local storage
  const shouldUseApi = isAuthenticated && storageType === 'supabase';

  // Define note queries and mutations
  const { 
    data: notes, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: [shouldUseApi ? '/api/notes' : 'local-notes'],
    queryFn: async ({ queryKey }) => {
      if (queryKey[0] === '/api/notes') {
        const res = await fetch('/api/notes', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch notes');
        return await res.json();
      } else {
        // Use local storage
        return await localDb.getAllNotes();
      }
    },
    // Only enable when authentication status matches storage type
    enabled: storageType === 'supabase' ? isAuthenticated : true,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (newNote: Partial<InsertNote>) => {
      if (shouldUseApi) {
        const res = await apiRequest('POST', '/api/notes', newNote);
        return await res.json();
      } else {
        // Use local storage
        return await localDb.createNote(newNote);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [shouldUseApi ? '/api/notes' : 'local-notes'] });
      toast({
        title: 'Note created',
        description: 'Your note has been created successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create note',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (updatedNote: Partial<Note> & { id: number }) => {
      if (shouldUseApi) {
        const res = await apiRequest('PATCH', `/api/notes/${updatedNote.id}`, updatedNote);
        return await res.json();
      } else {
        // Use local storage
        return await localDb.updateNote(updatedNote.id, updatedNote);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [shouldUseApi ? '/api/notes' : 'local-notes'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update note',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (shouldUseApi) {
        await apiRequest('DELETE', `/api/notes/${id}`);
        return true;
      } else {
        // Use local storage
        return await localDb.deleteNote(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [shouldUseApi ? '/api/notes' : 'local-notes'] });
      toast({
        title: 'Note deleted',
        description: 'Your note has been deleted successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete note',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });

  const getNote = useCallback(
    (id: number) => {
      return notes?.find(note => note.id === id);
    },
    [notes]
  );

  const createNote = useCallback(
    async (note: Partial<InsertNote>) => {
      return await createNoteMutation.mutateAsync(note);
    },
    [createNoteMutation]
  );

  const updateNote = useCallback(
    async (note: Partial<Note> & { id: number }) => {
      return await updateNoteMutation.mutateAsync(note);
    },
    [updateNoteMutation]
  );

  const deleteNote = useCallback(
    async (id: number) => {
      return await deleteNoteMutation.mutateAsync(id);
    },
    [deleteNoteMutation]
  );

  return {
    notes,
    getNote,
    createNote,
    updateNote,
    deleteNote,
    isLoading,
    error: error instanceof Error ? error : null,
  };
}
