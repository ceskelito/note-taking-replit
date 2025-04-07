import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Folder, InsertFolder } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useStorage } from "./useStorage";

export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const { toast } = useToast();
  const { storageType, syncFolders } = useStorage();
  
  // Fetch folders from API or local storage
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/folders'], 
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Initialize folders from the query data
  useEffect(() => {
    if (data) {
      setFolders(data);
    }
  }, [data]);
  
  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: (folderData: InsertFolder) => 
      apiRequest('POST', '/api/folders', folderData),
    onSuccess: async (response) => {
      const newFolder = await response.json();
      setFolders(prev => [...prev, newFolder]);
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      
      toast({
        title: "Folder created",
        description: "Your folder has been created successfully",
      });
      
      // Sync folders if using WebDAV or Supabase
      if (storageType !== 'local') {
        syncFolders();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to create folder",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Update folder mutation
  const updateFolderMutation = useMutation({
    mutationFn: (folderData: Folder) => 
      apiRequest('PUT', `/api/folders/${folderData.id}`, folderData),
    onSuccess: async (response, variables) => {
      const updatedFolder = await response.json();
      setFolders(prev => prev.map(folder => 
        folder.id === updatedFolder.id ? updatedFolder : folder
      ));
      
      if (selectedFolder?.id === updatedFolder.id) {
        setSelectedFolder(updatedFolder);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      
      // Sync folders if using WebDAV or Supabase
      if (storageType !== 'local') {
        syncFolders();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to update folder",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: number) => 
      apiRequest('DELETE', `/api/folders/${folderId}`),
    onSuccess: async (_, folderId) => {
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      
      if (selectedFolder?.id === folderId) {
        setSelectedFolder(null);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      
      toast({
        title: "Folder deleted",
        description: "Your folder has been deleted successfully",
      });
      
      // Sync folders if using WebDAV or Supabase
      if (storageType !== 'local') {
        syncFolders();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to delete folder",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Select a folder
  const selectFolder = (folder: Folder | null) => {
    setSelectedFolder(folder);
  };
  
  // Create a new folder
  const createFolder = async (folderData: Partial<InsertFolder>) => {
    // For optimistic UI, create a temporary folder with a unique negative ID
    const tempId = -Math.floor(Math.random() * 1000);
    const tempFolder: Folder = {
      id: tempId,
      name: folderData.name || 'New Folder',
      userId: folderData.userId || null,
      color: folderData.color || null,
      createdAt: new Date(),
    };
    
    setFolders(prev => [...prev, tempFolder]);
    
    // Actually create the folder in the backend
    await createFolderMutation.mutateAsync({
      name: folderData.name || 'New Folder',
      userId: folderData.userId,
      color: folderData.color,
    } as InsertFolder);
  };
  
  // Update a folder
  const updateFolder = (folderData: Folder) => {
    // Optimistic update
    setFolders(prev => prev.map(folder => 
      folder.id === folderData.id ? { ...folder, ...folderData } : folder
    ));
    
    if (selectedFolder?.id === folderData.id) {
      setSelectedFolder({ ...selectedFolder, ...folderData });
    }
    
    // Actually update the folder in the backend
    updateFolderMutation.mutate(folderData);
  };
  
  // Delete a folder
  const deleteFolder = (folderId: number) => {
    deleteFolderMutation.mutate(folderId);
  };
  
  return {
    folders,
    selectedFolder,
    isLoading,
    error,
    selectFolder,
    createFolder,
    updateFolder,
    deleteFolder,
  };
};
