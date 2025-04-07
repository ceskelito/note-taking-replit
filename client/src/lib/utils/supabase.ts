import { User, Note, Folder, Tag, NoteTag } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { exportAllData, importAllData } from './storage';
import { saveMetadata, getMetadata } from './storage';

// Initialize Supabase connection
export const initializeSupabase = async (user: User): Promise<boolean> => {
  try {
    if (!user || !user.id) {
      throw new Error('User is required to initialize Supabase connection');
    }
    
    // Test the connection by making a request to the API
    const response = await apiRequest('GET', '/api/supabase/test', {});
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to connect to Supabase');
    }
    
    console.log('Supabase connection established successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    throw error;
  }
};

// Sync all data with Supabase
export const syncWithSupabase = async (
  user: User,
  dataType?: 'notes' | 'folders' | 'tags'
): Promise<boolean> => {
  try {
    if (!user || !user.id) {
      console.log('User is required for Supabase sync');
      return false;
    }
    
    // Get the last sync time
    const syncMetadata = await getMetadata('supabase-sync');
    const lastSyncTime = syncMetadata?.lastSyncTime ? new Date(syncMetadata.lastSyncTime) : null;
    
    // Export all local data
    const localData = await exportAllData();
    
    // Fetch remote data from Supabase via our API
    let remoteData: {
      notes?: Note[];
      folders?: Folder[];
      tags?: Tag[];
      noteTags?: NoteTag[];
    } = {};
    
    if (!dataType || dataType === 'notes') {
      const notesResponse = await apiRequest('GET', '/api/supabase/notes', {});
      remoteData.notes = await notesResponse.json();
      
      const noteTagsResponse = await apiRequest('GET', '/api/supabase/note-tags', {});
      remoteData.noteTags = await noteTagsResponse.json();
    }
    
    if (!dataType || dataType === 'folders') {
      const foldersResponse = await apiRequest('GET', '/api/supabase/folders', {});
      remoteData.folders = await foldersResponse.json();
    }
    
    if (!dataType || dataType === 'tags') {
      const tagsResponse = await apiRequest('GET', '/api/supabase/tags', {});
      remoteData.tags = await tagsResponse.json();
    }
    
    // Function to merge data
    const mergeData = <T extends { id: number }>(localItems: T[], remoteItems: T[]): T[] => {
      if (!remoteItems || remoteItems.length === 0) {
        return localItems;
      }
      
      // Create a map of local items by ID
      const localItemMap = new Map<number, T>();
      localItems.forEach(item => {
        if (item.id > 0) { // Only consider items with positive IDs
          localItemMap.set(item.id, item);
        }
      });
      
      // Create a map of remote items by ID
      const remoteItemMap = new Map<number, T>();
      remoteItems.forEach(item => {
        if (item.id > 0) { // Only consider items with positive IDs
          remoteItemMap.set(item.id, item);
        }
      });
      
      // Merge items
      const mergedItems: T[] = [];
      
      // First add all local items
      localItems.forEach(localItem => {
        if (localItem.id > 0) { // Only consider items with positive IDs
          const remoteItem = remoteItemMap.get(localItem.id);
          
          if (remoteItem) {
            // Item exists both locally and remotely
            // Use the most recent version if we have timestamps
            if ('updatedAt' in localItem && 'updatedAt' in remoteItem) {
              const localDate = new Date((localItem as any).updatedAt);
              const remoteDate = new Date((remoteItem as any).updatedAt);
              
              mergedItems.push(localDate > remoteDate ? localItem : remoteItem);
            } else {
              // If no timestamps, prefer local version
              mergedItems.push(localItem);
            }
          } else {
            // Item exists only locally
            mergedItems.push(localItem);
          }
        } else {
          // Temporary IDs should be kept as is
          mergedItems.push(localItem);
        }
      });
      
      // Add remote items that don't exist locally
      remoteItems.forEach(remoteItem => {
        if (remoteItem.id > 0 && !localItemMap.has(remoteItem.id)) {
          mergedItems.push(remoteItem);
        }
      });
      
      return mergedItems;
    };
    
    // Merge data based on the dataType parameter
    let mergedData: {
      notes?: Note[];
      folders?: Folder[];
      tags?: Tag[];
      noteTags?: NoteTag[];
    } = {};
    
    if (!dataType || dataType === 'notes') {
      mergedData.notes = mergeData<Note>(localData.notes, remoteData.notes || []);
      mergedData.noteTags = mergeData<NoteTag>(localData.noteTags, remoteData.noteTags || []);
    }
    
    if (!dataType || dataType === 'folders') {
      mergedData.folders = mergeData<Folder>(localData.folders, remoteData.folders || []);
    }
    
    if (!dataType || dataType === 'tags') {
      mergedData.tags = mergeData<Tag>(localData.tags, remoteData.tags || []);
    }
    
    // Import merged data locally
    await importAllData(mergedData);
    
    // Upload merged data back to Supabase
    if (!dataType || dataType === 'notes') {
      await apiRequest('POST', '/api/supabase/sync', {
        notes: mergedData.notes,
        noteTags: mergedData.noteTags,
      });
    }
    
    if (!dataType || dataType === 'folders') {
      await apiRequest('POST', '/api/supabase/sync', {
        folders: mergedData.folders,
      });
    }
    
    if (!dataType || dataType === 'tags') {
      await apiRequest('POST', '/api/supabase/sync', {
        tags: mergedData.tags,
      });
    }
    
    // Update sync metadata
    await saveMetadata('supabase-sync', {
      lastSyncTime: new Date(),
    });
    
    console.log('Supabase sync completed successfully');
    return true;
  } catch (error) {
    console.error('Failed to sync with Supabase:', error);
    throw error;
  }
};
