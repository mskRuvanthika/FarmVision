import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const isConnected = Boolean(supabaseUrl && publicAnonKey);

export const supabase = createClient(
  supabaseUrl,
  publicAnonKey
);
