import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/auth-context';
import { useStorage } from '@/context/storage-context';
import { useLocalDb } from '@/lib/db';
import { type Folder, type InsertFolder } from '@shared/schema';
import { useToast } from './use-toast';

export interface FoldersHook {
  folders: Folder[] | undefined;
  getFolder: (id: number) => Folder | undefined;
  createFolder: (folder: Partial<InsertFolder>) => Promise<Folder | undefined>;
  updateFolder: (folder: Partial<Folder> & { id: number }) => Promise<Folder | undefined>;
  deleteFolder: (id: number) => Promise<boolean>;
  isLoading: boolean;
  isCreatingFolder: boolean;
  error: Error | null;
}

export function useFolders(): FoldersHook {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { storageType } = useStorage();
  const localDb = useLocalDb();
  
  // Determine if we should fetch from API or local storage
  const shouldUseApi = isAuthenticated && storageType === 'supabase';

  // Define folder queries and mutations
  const { 
    data: folders, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: [shouldUseApi ? '/api/folders' : 'local-folders'],
    queryFn: async ({ queryKey }) => {
      if (queryKey[0] === '/api/folders') {
        const res = await fetch('/api/folders', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch folders');
        return await res.json();
      } else {
        // Use local storage
        return await localDb.getAllFolders();
      }
    },
    // Only enable when authentication status matches storage type
    enabled: storageType === 'supabase' ? isAuthenticated : true,
  });

  const createFolderMutation = useMutation({
    mutationFn: async (newFolder: Partial<InsertFolder>) => {
      if (shouldUseApi) {
        const res = await apiRequest('POST', '/api/folders', newFolder);
        return await res.json();
      } else {
        // Use local storage
        return await localDb.createFolder(newFolder);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [shouldUseApi ? '/api/folders' : 'local-folders'] });
      toast({
        title: 'Folder created',
        description: 'Your folder has been created successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create folder',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });

  const updateFolderMutation = useMutation({
    mutationFn: async (updatedFolder: Partial<Folder> & { id: number }) => {
      if (shouldUseApi) {
        const res = await apiRequest('PATCH', `/api/folders/${updatedFolder.id}`, updatedFolder);
        return await res.json();
      } else {
        // Use local storage
        return await localDb.updateFolder(updatedFolder.id, updatedFolder);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [shouldUseApi ? '/api/folders' : 'local-folders'] });
      toast({
        title: 'Folder updated',
        description: 'Your folder has been updated successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update folder',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: number) => {
      if (shouldUseApi) {
        await apiRequest('DELETE', `/api/folders/${id}`);
        return true;
      } else {
        // Use local storage
        return await localDb.deleteFolder(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [shouldUseApi ? '/api/folders' : 'local-folders'] });
      toast({
        title: 'Folder deleted',
        description: 'Your folder has been deleted successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete folder',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });

  const getFolder = useCallback(
    (id: number) => {
      return folders?.find(folder => folder.id === id);
    },
    [folders]
  );

  const createFolder = useCallback(
    async (folder: Partial<InsertFolder>) => {
      return await createFolderMutation.mutateAsync(folder);
    },
    [createFolderMutation]
  );

  const updateFolder = useCallback(
    async (folder: Partial<Folder> & { id: number }) => {
      return await updateFolderMutation.mutateAsync(folder);
    },
    [updateFolderMutation]
  );

  const deleteFolder = useCallback(
    async (id: number) => {
      return await deleteFolderMutation.mutateAsync(id);
    },
    [deleteFolderMutation]
  );

  return {
    folders,
    getFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    isLoading,
    isCreatingFolder: createFolderMutation.isPending,
    error: error instanceof Error ? error : null,
  };
}
