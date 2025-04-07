import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tag, InsertTag } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useStorage } from "./useStorage";

export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const { toast } = useToast();
  const { storageType, syncTags } = useStorage();
  
  // Fetch tags from API or local storage
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/tags'], 
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Initialize tags from the query data
  useEffect(() => {
    if (data) {
      setTags(data);
    }
  }, [data]);
  
  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: (tagData: InsertTag) => 
      apiRequest('POST', '/api/tags', tagData),
    onSuccess: async (response) => {
      const newTag = await response.json();
      setTags(prev => [...prev, newTag]);
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      
      toast({
        title: "Tag created",
        description: "Your tag has been created successfully",
      });
      
      // Sync tags if using WebDAV or Supabase
      if (storageType !== 'local') {
        syncTags();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to create tag",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: (tagData: Tag) => 
      apiRequest('PUT', `/api/tags/${tagData.id}`, tagData),
    onSuccess: async (response, variables) => {
      const updatedTag = await response.json();
      setTags(prev => prev.map(tag => 
        tag.id === updatedTag.id ? updatedTag : tag
      ));
      
      if (selectedTag?.id === updatedTag.id) {
        setSelectedTag(updatedTag);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      
      // Sync tags if using WebDAV or Supabase
      if (storageType !== 'local') {
        syncTags();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to update tag",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: (tagId: number) => 
      apiRequest('DELETE', `/api/tags/${tagId}`),
    onSuccess: async (_, tagId) => {
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      
      if (selectedTag?.id === tagId) {
        setSelectedTag(null);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      
      toast({
        title: "Tag deleted",
        description: "Your tag has been deleted successfully",
      });
      
      // Sync tags if using WebDAV or Supabase
      if (storageType !== 'local') {
        syncTags();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to delete tag",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Select a tag
  const selectTag = (tag: Tag | null) => {
    setSelectedTag(tag);
  };
  
  // Create a new tag
  const createTag = async (tagData: Partial<InsertTag>) => {
    // For optimistic UI, create a temporary tag with a unique negative ID
    const tempId = -Math.floor(Math.random() * 1000);
    const tempTag: Tag = {
      id: tempId,
      name: tagData.name || 'New Tag',
      userId: tagData.userId || null,
      color: tagData.color || null,
      createdAt: new Date(),
    };
    
    setTags(prev => [...prev, tempTag]);
    
    // Actually create the tag in the backend
    await createTagMutation.mutateAsync({
      name: tagData.name || 'New Tag',
      userId: tagData.userId,
      color: tagData.color,
    } as InsertTag);
  };
  
  // Update a tag
  const updateTag = (tagData: Tag) => {
    // Optimistic update
    setTags(prev => prev.map(tag => 
      tag.id === tagData.id ? { ...tag, ...tagData } : tag
    ));
    
    if (selectedTag?.id === tagData.id) {
      setSelectedTag({ ...selectedTag, ...tagData });
    }
    
    // Actually update the tag in the backend
    updateTagMutation.mutate(tagData);
  };
  
  // Delete a tag
  const deleteTag = (tagId: number) => {
    deleteTagMutation.mutate(tagId);
  };
  
  // Add a tag to a note
  const addTagToNote = (noteId: number, tagId: number) => {
    apiRequest('POST', '/api/note-tags', { noteId, tagId });
    queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
  };
  
  // Remove a tag from a note
  const removeTagFromNote = (noteId: number, tagId: number) => {
    apiRequest('DELETE', `/api/note-tags/${noteId}/${tagId}`);
    queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
  };
  
  return {
    tags,
    selectedTag,
    isLoading,
    error,
    selectTag,
    createTag,
    updateTag,
    deleteTag,
    addTagToNote,
    removeTagFromNote,
  };
};
