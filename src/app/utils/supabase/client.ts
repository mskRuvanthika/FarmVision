import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const url = projectId ? `https://${projectId}.supabase.co` : null;
const key = publicAnonKey ?? null;

export const isConnected: boolean = Boolean(url && key);

export const supabase: SupabaseClient | null =
  isConnected && url && key ? createClient(url, key) : null;
