import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useStorage } from '@/context/storage-context';
import { useLocalDb } from '@/lib/db';
import { useSupabase } from '@/lib/supabase';
import { useWebdav } from '@/lib/webdav';
import { useToast } from '@/hooks/use-toast';

export type StorageType = 'local' | 'supabase' | 'webdav';

export interface StorageHook {
  storageType: StorageType;
  isReady: boolean;
  error: Error | null;
  setStorageType: (type: StorageType) => Promise<void>;
  configureWebdav: (url: string, username?: string, password?: string) => Promise<boolean>;
}

export function useStorageHook(): StorageHook {
  const { toast } = useToast();
  const { storageType, setStorageType, webdavConfig, setWebdavConfig } = useStorage();
  const { isAuthenticated, user } = useAuth();
  const localDb = useLocalDb();
  const supabase = useSupabase();
  const webdav = useWebdav();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initStorage = async () => {
      try {
        // Initialize appropriate storage based on type
        if (storageType === 'local') {
          await localDb.init();
        } else if (storageType === 'supabase' && isAuthenticated) {
          // Supabase is initialized with the auth
        } else if (storageType === 'webdav' && webdavConfig) {
          await webdav.init(webdavConfig.url, webdavConfig.username, webdavConfig.password);
        }

        setIsReady(true);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize storage:', err);
        setError(err instanceof Error ? err : new Error('Unknown storage initialization error'));
        
        // Fallback to local storage on error
        if (storageType !== 'local') {
          toast({
            title: 'Storage error',
            description: `Failed to initialize ${storageType} storage. Falling back to local storage.`,
            variant: 'destructive'
          });
          
          await setStorageType('local');
        }
      }
    };

    initStorage();
  }, [storageType, isAuthenticated, webdavConfig]);

  const changeStorageType = async (type: StorageType) => {
    try {
      // If switching to Supabase, ensure the user is authenticated
      if (type === 'supabase' && !isAuthenticated) {
        throw new Error('You must be logged in to use Supabase storage');
      }
      
      // If switching to WebDAV, ensure there's a WebDAV config
      if (type === 'webdav' && !webdavConfig) {
        throw new Error('WebDAV must be configured first');
      }

      await setStorageType(type);
      toast({
        title: 'Storage updated',
        description: `Now using ${type} storage`,
      });
    } catch (err) {
      toast({
        title: 'Storage change failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const configureWebdav = async (url: string, username?: string, password?: string) => {
    try {
      // Test the WebDAV connection
      await webdav.test(url, username, password);
      
      // Save the WebDAV configuration
      setWebdavConfig({ url, username, password });
      
      toast({
        title: 'WebDAV configured',
        description: 'WebDAV connection successful',
      });
      
      return true;
    } catch (err) {
      toast({
        title: 'WebDAV configuration failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      });
      
      return false;
    }
  };

  return {
    storageType,
    isReady,
    error,
    setStorageType: changeStorageType,
    configureWebdav,
  };
}
