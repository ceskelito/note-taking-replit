import { createClient, WebDAVClient } from 'webdav';
import { WebDAVConfig, Note, Folder, Tag, NoteTag } from '@shared/schema';
import { exportAllData, importAllData } from './storage';
import { saveMetadata, getMetadata } from './storage';

let webdavClient: WebDAVClient | null = null;

// Initialize WebDAV client
export const initializeWebDAV = async (config: WebDAVConfig): Promise<WebDAVClient> => {
  if (!config.endpoint) {
    throw new Error('WebDAV endpoint is required');
  }
  
  // Create WebDAV client
  webdavClient = createClient(config.endpoint, {
    username: config.username,
    password: config.password,
  });
  
  // Create folders structure if it doesn't exist
  try {
    // Check if the base directory exists
    if (!(await webdavClient.exists('/notekeeper'))) {
      await webdavClient.createDirectory('/notekeeper');
    }
    
    // Create data directory if it doesn't exist
    if (!(await webdavClient.exists('/notekeeper/data'))) {
      await webdavClient.createDirectory('/notekeeper/data');
    }
    
    // Test the connection by writing a small file
    const testData = JSON.stringify({ test: 'connection', timestamp: new Date().toISOString() });
    await webdavClient.putFileContents('/notekeeper/connection-test.json', testData, { overwrite: true });
    
    console.log('WebDAV connection established successfully');
    
    return webdavClient;
  } catch (error) {
    console.error('Failed to initialize WebDAV:', error);
    throw new Error('Failed to initialize WebDAV. Please check your credentials and endpoint.');
  }
};

// Get WebDAV client (initialize if needed)
export const getWebDAVClient = async (config: WebDAVConfig): Promise<WebDAVClient> => {
  if (webdavClient) {
    return webdavClient;
  }
  
  return initializeWebDAV(config);
};

// Upload a file to WebDAV
export const uploadToWebDAV = async (
  config: WebDAVConfig,
  path: string,
  data: any
): Promise<boolean> => {
  try {
    const client = await getWebDAVClient(config);
    const jsonData = JSON.stringify(data);
    await client.putFileContents(path, jsonData, { overwrite: true });
    return true;
  } catch (error) {
    console.error(`Failed to upload to WebDAV (${path}):`, error);
    throw error;
  }
};

// Download a file from WebDAV
export const downloadFromWebDAV = async (
  config: WebDAVConfig,
  path: string
): Promise<any> => {
  try {
    const client = await getWebDAVClient(config);
    
    // Check if the file exists
    const exists = await client.exists(path);
    if (!exists) {
      return null;
    }
    
    const response = await client.getFileContents(path, { format: 'text' });
    if (typeof response === 'string') {
      return JSON.parse(response);
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to download from WebDAV (${path}):`, error);
    // If file doesn't exist or there's an error, return null
    return null;
  }
};

// Sync all data with WebDAV
export const syncWithWebDAV = async (
  config: WebDAVConfig,
  dataType?: 'notes' | 'folders' | 'tags'
): Promise<boolean> => {
  try {
    if (!config.enabled) {
      console.log('WebDAV sync is disabled');
      return false;
    }
    
    const client = await getWebDAVClient(config);
    
    // Get the last sync time
    const syncMetadata = await getMetadata('webdav-sync');
    const lastSyncTime = syncMetadata?.lastSyncTime ? new Date(syncMetadata.lastSyncTime) : null;
    
    // Export all local data
    const localData = await exportAllData();
    
    // Paths for WebDAV files
    const notesPath = '/notekeeper/data/notes.json';
    const foldersPath = '/notekeeper/data/folders.json';
    const tagsPath = '/notekeeper/data/tags.json';
    const noteTagsPath = '/notekeeper/data/note-tags.json';
    
    // Function to download and merge data
    const downloadAndMerge = async <T extends { id: number }>(
      path: string,
      localItems: T[]
    ): Promise<T[]> => {
      const remoteItems = await downloadFromWebDAV(config, path);
      
      if (!remoteItems) {
        // If no remote data, just use local data
        return localItems;
      }
      
      // Create a map of local items by ID
      const localItemMap = new Map<number, T>();
      localItems.forEach(item => localItemMap.set(item.id, item));
      
      // Create a map of remote items by ID
      const remoteItemMap = new Map<number, T>();
      remoteItems.forEach((item: T) => {
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
      remoteItems.forEach((remoteItem: T) => {
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
      mergedData.notes = await downloadAndMerge<Note>(notesPath, localData.notes);
      mergedData.noteTags = await downloadAndMerge<NoteTag>(noteTagsPath, localData.noteTags);
    }
    
    if (!dataType || dataType === 'folders') {
      mergedData.folders = await downloadAndMerge<Folder>(foldersPath, localData.folders);
    }
    
    if (!dataType || dataType === 'tags') {
      mergedData.tags = await downloadAndMerge<Tag>(tagsPath, localData.tags);
    }
    
    // Import merged data locally
    await importAllData(mergedData);
    
    // Upload merged data back to WebDAV
    if (!dataType || dataType === 'notes') {
      await uploadToWebDAV(config, notesPath, mergedData.notes);
      await uploadToWebDAV(config, noteTagsPath, mergedData.noteTags);
    }
    
    if (!dataType || dataType === 'folders') {
      await uploadToWebDAV(config, foldersPath, mergedData.folders);
    }
    
    if (!dataType || dataType === 'tags') {
      await uploadToWebDAV(config, tagsPath, mergedData.tags);
    }
    
    // Update sync metadata
    await saveMetadata('webdav-sync', {
      lastSyncTime: new Date(),
    });
    
    console.log('WebDAV sync completed successfully');
    return true;
  } catch (error) {
    console.error('Failed to sync with WebDAV:', error);
    throw error;
  }
};
