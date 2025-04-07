import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/auth-context';
import { useStorage } from '@/context/storage-context';
import { useLocalDb } from '@/lib/db';
import { type Tag, type InsertTag } from '@shared/schema';
import { useToast } from './use-toast';

export interface TagsHook {
  tags: Tag[] | undefined;
  getTag: (id: number) => Tag | undefined;
  createTag: (tag: Partial<InsertTag>) => Promise<Tag | undefined>;
  updateTag: (tag: Partial<Tag> & { id: number }) => Promise<Tag | undefined>;
  deleteTag: (id: number) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
}

export function useTags(): TagsHook {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { storageType } = useStorage();
  const localDb = useLocalDb();
  
  // Determine if we should fetch from API or local storage
  const shouldUseApi = isAuthenticated && storageType === 'supabase';

  // Define tag queries and mutations
  const { 
    data: tags, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: [shouldUseApi ? '/api/tags' : 'local-tags'],
    queryFn: async ({ queryKey }) => {
      if (queryKey[0] === '/api/tags') {
        const res = await fetch('/api/tags', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch tags');
        return await res.json();
      } else {
        // Use local storage
        return await localDb.getAllTags();
      }
    },
    // Only enable when authentication status matches storage type
    enabled: storageType === 'supabase' ? isAuthenticated : true,
  });

  const createTagMutation = useMutation({
    mutationFn: async (newTag: Partial<InsertTag>) => {
      if (shouldUseApi) {
        const res = await apiRequest('POST', '/api/tags', newTag);
        return await res.json();
      } else {
        // Use local storage
        return await localDb.createTag(newTag);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [shouldUseApi ? '/api/tags' : 'local-tags'] });
      toast({
        title: 'Tag created',
        description: 'Your tag has been created successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create tag',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });

  const updateTagMutation = useMutation({
    mutationFn: async (updatedTag: Partial<Tag> & { id: number }) => {
      if (shouldUseApi) {
        const res = await apiRequest('PATCH', `/api/tags/${updatedTag.id}`, updatedTag);
        return await res.json();
      } else {
        // Use local storage
        return await localDb.updateTag(updatedTag.id, updatedTag);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [shouldUseApi ? '/api/tags' : 'local-tags'] });
      toast({
        title: 'Tag updated',
        description: 'Your tag has been updated successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update tag',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: number) => {
      if (shouldUseApi) {
        await apiRequest('DELETE', `/api/tags/${id}`);
        return true;
      } else {
        // Use local storage
        return await localDb.deleteTag(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [shouldUseApi ? '/api/tags' : 'local-tags'] });
      toast({
        title: 'Tag deleted',
        description: 'Your tag has been deleted successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete tag',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });

  const getTag = useCallback(
    (id: number) => {
      return tags?.find(tag => tag.id === id);
    },
    [tags]
  );

  const createTag = useCallback(
    async (tag: Partial<InsertTag>) => {
      return await createTagMutation.mutateAsync(tag);
    },
    [createTagMutation]
  );

  const updateTag = useCallback(
    async (tag: Partial<Tag> & { id: number }) => {
      return await updateTagMutation.mutateAsync(tag);
    },
    [updateTagMutation]
  );

  const deleteTag = useCallback(
    async (id: number) => {
      return await deleteTagMutation.mutateAsync(id);
    },
    [deleteTagMutation]
  );

  return {
    tags,
    getTag,
    createTag,
    updateTag,
    deleteTag,
    isLoading,
    error: error instanceof Error ? error : null,
  };
}
