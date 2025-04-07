import { useState, useEffect, useCallback } from "react";
import { User, WebDAVConfig } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { initializeLocalStorage, clearLocalStorage } from "@/lib/utils/storage";
import { initializeWebDAV, syncWithWebDAV } from "@/lib/utils/webdav";
import { getCurrentUser } from "@/lib/utils/auth";
import { initializeSupabase, syncWithSupabase } from "@/lib/utils/supabase";

// Type for storage management
type StorageType = "local" | "webdav" | "supabase";

export const useStorage = () => {
  const [storageType, setStorageType] = useState<StorageType>("local");
  const [webdavConfig, setWebdavConfig] = useState<WebDAVConfig | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  
  // Fetch current user
  const { data: userData, refetch: refetchUser } = useQuery({
    queryKey: ['/api/auth/me'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: false, // Don't auto-fetch, we'll trigger manually
  });
  
  // Fetch WebDAV config
  const { data: webdavData, refetch: refetchWebDAV } = useQuery({
    queryKey: ['/api/webdav/config'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: false, // Don't auto-fetch, we'll trigger manually
  });
  
  // Initialize storage based on user state
  useEffect(() => {
    const initialize = async () => {
      try {
        // Try to get current user
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          // If user is logged in, check if WebDAV is enabled
          const webdavConfigData = await refetchWebDAV();
          const config = webdavConfigData.data as WebDAVConfig | null;
          setWebdavConfig(config);
          
          if (config && config.enabled) {
            // Initialize WebDAV
            await initializeWebDAV(config);
            setStorageType("webdav");
          } else {
            // Use Supabase if WebDAV is not enabled
            await initializeSupabase(currentUser);
            setStorageType("supabase");
          }
        } else {
          // Use local storage if not logged in
          await initializeLocalStorage();
          setStorageType("local");
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize storage:", error);
        // Fallback to local storage
        await initializeLocalStorage();
        setStorageType("local");
        setIsInitialized(true);
        
        toast({
          title: "Storage initialization failed",
          description: "Falling back to local storage. Your data will be stored on this device only.",
          variant: "destructive",
        });
      }
    };
    
    initialize();
  }, []);
  
  // Update WebDAV config
  const updateWebDAVConfig = async (config: WebDAVConfig) => {
    try {
      // Save to backend
      const response = await fetch('/api/webdav/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update WebDAV configuration');
      }
      
      const updatedConfig = await response.json();
      setWebdavConfig(updatedConfig);
      
      if (updatedConfig.enabled) {
        // Initialize WebDAV with new config
        await initializeWebDAV(updatedConfig);
        setStorageType("webdav");
        
        // Sync data from current storage to WebDAV
        await syncData();
        
        toast({
          title: "WebDAV enabled",
          description: "Your notes will now sync with WebDAV",
        });
      } else if (user) {
        // Fallback to Supabase if user is logged in
        await initializeSupabase(user);
        setStorageType("supabase");
        
        toast({
          title: "WebDAV disabled",
          description: "Your notes will be stored in the cloud",
        });
      } else {
        // Fallback to local storage
        await initializeLocalStorage();
        setStorageType("local");
        
        toast({
          title: "WebDAV disabled",
          description: "Your notes will be stored locally on this device",
        });
      }
      
      return updatedConfig;
    } catch (error) {
      console.error("Failed to update WebDAV config:", error);
      toast({
        title: "Failed to update WebDAV configuration",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Sync all data based on current storage type
  const syncData = async () => {
    try {
      if (!isInitialized) return;
      
      if (storageType === "webdav" && webdavConfig) {
        await syncWithWebDAV(webdavConfig);
      } else if (storageType === "supabase" && user) {
        await syncWithSupabase(user);
      }
      
      // Refresh data in UI
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      
      return true;
    } catch (error) {
      console.error("Failed to sync data:", error);
      toast({
        title: "Sync failed",
        description: "Failed to synchronize your data. Some changes may not be saved.",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Sync notes only
  const syncNotes = async () => {
    try {
      if (!isInitialized) return;
      
      if (storageType === "webdav" && webdavConfig) {
        await syncWithWebDAV(webdavConfig, 'notes');
      } else if (storageType === "supabase" && user) {
        await syncWithSupabase(user, 'notes');
      }
      
      return true;
    } catch (error) {
      console.error("Failed to sync notes:", error);
      return false;
    }
  };
  
  // Sync folders only
  const syncFolders = async () => {
    try {
      if (!isInitialized) return;
      
      if (storageType === "webdav" && webdavConfig) {
        await syncWithWebDAV(webdavConfig, 'folders');
      } else if (storageType === "supabase" && user) {
        await syncWithSupabase(user, 'folders');
      }
      
      return true;
    } catch (error) {
      console.error("Failed to sync folders:", error);
      return false;
    }
  };
  
  // Sync tags only
  const syncTags = async () => {
    try {
      if (!isInitialized) return;
      
      if (storageType === "webdav" && webdavConfig) {
        await syncWithWebDAV(webdavConfig, 'tags');
      } else if (storageType === "supabase" && user) {
        await syncWithSupabase(user, 'tags');
      }
      
      return true;
    } catch (error) {
      console.error("Failed to sync tags:", error);
      return false;
    }
  };
  
  // Clear storage and data
  const clearStorage = async () => {
    try {
      await clearLocalStorage();
      
      // Clear data from state
      queryClient.invalidateQueries();
      
      toast({
        title: "Storage cleared",
        description: "All local data has been cleared",
      });
      
      return true;
    } catch (error) {
      console.error("Failed to clear storage:", error);
      toast({
        title: "Failed to clear storage",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Refresh user and storage information
  const refresh = useCallback(async () => {
    try {
      const userRefreshData = await refetchUser();
      const currentUser = userRefreshData.data as User | null;
      setUser(currentUser);
      
      if (currentUser) {
        const webdavRefreshData = await refetchWebDAV();
        const config = webdavRefreshData.data as WebDAVConfig | null;
        setWebdavConfig(config);
        
        if (config && config.enabled) {
          await initializeWebDAV(config);
          setStorageType("webdav");
        } else {
          await initializeSupabase(currentUser);
          setStorageType("supabase");
        }
      } else {
        await initializeLocalStorage();
        setStorageType("local");
      }
      
      // Refresh data in UI
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      
      return true;
    } catch (error) {
      console.error("Failed to refresh storage:", error);
      return false;
    }
  }, [refetchUser, refetchWebDAV]);
  
  return {
    storageType,
    webdavConfig,
    user,
    isInitialized,
    updateWebDAVConfig,
    syncData,
    syncNotes,
    syncFolders,
    syncTags,
    clearStorage,
    refresh,
  };
};
