// Supabase client with secure environment configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { environment } from '@/config/environment';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  environment.supabase.url,
  environment.supabase.anonKey,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);