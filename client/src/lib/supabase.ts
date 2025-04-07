import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/auth-context';
import { useStorage } from '@/context/storage-context';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client only if URL is provided, otherwise use a dummy client
const supabaseClient = supabaseUrl 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
    auth: {
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
    }
  } as any; // Type assertion for simplicity

// Define a hook to use the Supabase client
export function useSupabase() {
  const { isAuthenticated, user } = useAuth();

  const login = async (email: string, password: string) => {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const signup = async (email: string, password: string) => {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const logout = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  };

  const getCurrentUser = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
      throw new Error(error.message);
    }

    return data?.user;
  };

  // Function to sync data between Supabase and local storage
  const syncData = async (data: any) => {
    if (!isAuthenticated || !user) {
      throw new Error('User is not authenticated');
    }

    // Implement data syncing logic here
    // This would involve sending data to Supabase and retrieving updates
  };

  return {
    client: supabaseClient,
    login,
    signup,
    logout,
    getCurrentUser,
    syncData,
  };
}
