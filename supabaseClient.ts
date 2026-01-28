import { createClient } from '@supabase/supabase-js';

// Helper safe access for Vite environment variables
const getMetaEnv = () => {
  try {
    return (import.meta as any).env || {};
  } catch {
    return {};
  }
}

const env = getMetaEnv();

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid config. If not, we are in Demo/Offline Mode.
export const isDemoMode = !supabaseUrl || !supabaseKey;

if (isDemoMode) {
    console.warn("⚠️ Supabase Config missing (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Running in DEMO MODE.");
}

// Create a single supabase client for interacting with your database
export const supabase = isDemoMode 
    ? null 
    : createClient(supabaseUrl, supabaseKey);
