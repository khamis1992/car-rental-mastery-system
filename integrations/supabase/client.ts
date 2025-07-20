
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://rtottdvuftbqktzborvv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0b3R0ZHZ1ZnRicWt0emJvcnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODY2ODEsImV4cCI6MjA2Njk2MjY4MX0.jRVYkaYGCLr7f7SK3zo6x4KumaMard49pNc9xneoUbI';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});
