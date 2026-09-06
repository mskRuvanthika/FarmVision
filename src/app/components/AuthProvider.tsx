import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';

interface AuthContextType {
  user: any;
  loading: boolean;
  signOut: () => Promise<void>;
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<any>;
    signUp: (credentials: { email: string; password: string; options?: any }) => Promise<any>;
    signInWithOAuth: (options: any) => Promise<any>;
    resetPasswordForEmail: (email: string, options?: any) => Promise<any>;
    getSession: () => Promise<any>;
    onAuthStateChange: (callback: any) => any;
    signOut: () => Promise<any>;
  };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  auth: {
    signInWithPassword: async () => ({ error: new Error('Not initialized') }),
    signUp: async () => ({ error: new Error('Not initialized') }),
    signInWithOAuth: async () => ({ error: new Error('OAuth not available') }),
    resetPasswordForEmail: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: async () => ({ error: null }),
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      // No Supabase connection (missing env vars) — fail safe, not signed in.
      console.error('Supabase client not initialized. Check VITE_SUPABASE_ANON_KEY.');
      setUser(null);
      setLoading(false);
      return;
    }

    // Load existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Keep user state in sync with Supabase (login, logout, token refresh, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
    }
  };

  const authMethods = {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      if (!supabase) return { data: { user: null, session: null }, error: new Error('Supabase not connected') };
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    },

    signUp: async ({ email, password, options }: { email: string; password: string; options?: any }) => {
      if (!supabase) return { data: { user: null, session: null }, error: new Error('Supabase not connected') };

      const { data, error } = await supabase.auth.signUp({ email, password, options });

      // Create a matching row in public.farmers so RLS policies (auth.uid() = user_id)
      // have something to match against for this new user.
      if (data?.user && !error) {
        const { error: farmerError } = await supabase.from('farmers').insert({
          user_id: data.user.id,
          full_name: options?.data?.full_name ?? email.split('@')[0],
          email,
        });
        if (farmerError) {
          console.error('Could not create farmer record:', farmerError.message);
        }
      }

      return { data, error };
    },

    signInWithOAuth: async (options: any) => {
      if (!supabase) return { error: new Error('Supabase not connected') };
      const { data, error } = await supabase.auth.signInWithOAuth(options);
      return { data, error };
    },

    resetPasswordForEmail: async (email: string, options?: any) => {
      if (!supabase) return { error: new Error('Supabase not connected') };
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, options);
      return { data, error };
    },

    getSession: async () => {
      if (!supabase) return { data: { session: null }, error: new Error('Supabase not connected') };
      return supabase.auth.getSession();
    },

    onAuthStateChange: (callback: any) => {
      if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
      return supabase.auth.onAuthStateChange(callback);
    },

    signOut: async () => {
      if (!supabase) return { error: new Error('Supabase not connected') };
      const { error } = await supabase.auth.signOut();
      setUser(null);
      return { error };
    },
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, auth: authMethods }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
