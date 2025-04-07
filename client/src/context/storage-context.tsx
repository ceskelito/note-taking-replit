import { createContext, useContext, useState, useEffect } from 'react';
import { useLocalDb } from '@/lib/db';
import { useAuth } from './auth-context';

interface WebDAVConfig {
  url: string;
  username?: string;
  password?: string;
}

interface StorageContextProps {
  storageType: 'local' | 'supabase' | 'webdav';
  setStorageType: (type: 'local' | 'supabase' | 'webdav') => Promise<void>;
  webdavConfig: WebDAVConfig | null;
  setWebdavConfig: (config: WebDAVConfig | null) => void;
}

const StorageContext = createContext<StorageContextProps | undefined>(undefined);

const STORAGE_TYPE_KEY = 'notecraft_storage_type';
const WEBDAV_CONFIG_KEY = 'notecraft_webdav_config';

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const localDb = useLocalDb();
  const { isAuthenticated } = useAuth();
  
  // Initialize storage type from localStorage, defaulting to 'local'
  const [storageType, setStorageTypeState] = useState<'local' | 'supabase' | 'webdav'>(
    () => {
      const savedType = localStorage.getItem(STORAGE_TYPE_KEY);
      return (savedType as 'local' | 'supabase' | 'webdav') || 'local';
    }
  );
  
  // Initialize WebDAV config from localStorage
  const [webdavConfig, setWebdavConfigState] = useState<WebDAVConfig | null>(
    () => {
      const savedConfig = localStorage.getItem(WEBDAV_CONFIG_KEY);
      return savedConfig ? JSON.parse(savedConfig) : null;
    }
  );

  // Change storage type
  const setStorageType = async (type: 'local' | 'supabase' | 'webdav') => {
    // Validate storage type change
    if (type === 'supabase' && !isAuthenticated) {
      throw new Error('You must be logged in to use Supabase storage');
    }
    
    if (type === 'webdav' && !webdavConfig) {
      throw new Error('WebDAV must be configured first');
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_TYPE_KEY, type);
    setStorageTypeState(type);
    
    // Initialize the corresponding storage
    if (type === 'local') {
      await localDb.init();
    }
    
    // Note: Supabase and WebDAV initialization would typically happen here,
    // but we're handling that in their respective hooks
  };

  // Set WebDAV configuration
  const setWebdavConfig = (config: WebDAVConfig | null) => {
    if (config) {
      localStorage.setItem(WEBDAV_CONFIG_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(WEBDAV_CONFIG_KEY);
    }
    setWebdavConfigState(config);
  };

  // Initialize the default storage on first load
  useEffect(() => {
    const initStorage = async () => {
      try {
        if (storageType === 'local') {
          await localDb.init();
        } else if (storageType === 'supabase' && !isAuthenticated) {
          // If user is not authenticated but storage type is set to Supabase,
          // fall back to local storage
          await setStorageType('local');
        }
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        // Fall back to local storage on error
        await setStorageType('local');
      }
    };

    initStorage();
  }, []);

  const value = {
    storageType,
    setStorageType,
    webdavConfig,
    setWebdavConfig,
  };

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
