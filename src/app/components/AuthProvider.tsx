import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';

// Catalyst Web SDK is loaded globally from index.html
declare const catalyst: any;

interface AuthContextType {
  user: any;
  loading: boolean;
  signOut: () => Promise<void>;
  auth: {
    signInWithPassword: (credentials: {
      email: string;
      password: string;
    }) => Promise<any>;

    signUp: (credentials: {
      email: string;
      password: string;
      options?: any;
    }) => Promise<any>;

    signInWithOAuth: (options: any) => Promise<any>;

    resetPasswordForEmail: (
      email: string,
      options?: any
    ) => Promise<any>;

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
    signInWithPassword: async () => ({
      error: new Error('Not initialized'),
    }),

    signUp: async () => ({
      error: new Error('Not initialized'),
    }),

    signInWithOAuth: async () => ({
      error: new Error('OAuth not available'),
    }),

    resetPasswordForEmail: async () => ({
      error: null,
    }),

    getSession: async () => ({
      data: {
        session: null,
      },
      error: null,
    }),

    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    }),

    signOut: async () => ({
      error: null,
    }),
  },
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /*
   * Initialize authentication.
   *
   * Priority:
   * 1. Catalyst Authentication
   * 2. Existing Supabase Authentication
   *
   * Supabase is kept as a fallback so the existing
   * application continues working while Catalyst is
   * being integrated.
   */
  useEffect(() => {
    let supabaseListener: any = null;

    const initializeAuth = async () => {
      try {
        /*
         * ----------------------------------------------------
         * 1. CHECK CATALYST AUTHENTICATION
         * ----------------------------------------------------
         */

        if (
          typeof catalyst !== 'undefined' &&
          catalyst?.auth &&
          typeof catalyst.auth.isUserAuthenticated === 'function'
        ) {
          try {
            const catalystResponse =
              await catalyst.auth.isUserAuthenticated();

            if (
              catalystResponse?.status === 200 &&
              catalystResponse?.content
            ) {
              const catalystUser = catalystResponse.content;

              console.log(
                'Catalyst user authenticated:',
                catalystUser
              );

              setUser({
                id: catalystUser.user_id,
                email: catalystUser.email_id,
                first_name: catalystUser.first_name,
                last_name: catalystUser.last_name,

                source: 'catalyst',

                catalystUser: catalystUser,
              });

              setLoading(false);

              return;
            }
          } catch (catalystError) {
            console.log(
              'No active Catalyst session. Checking Supabase...',
              catalystError
            );
          }
        }

        /*
         * ----------------------------------------------------
         * 2. FALL BACK TO SUPABASE AUTHENTICATION
         * ----------------------------------------------------
         */

        if (!supabase) {
          console.error(
            'Supabase client not initialized. Check VITE_SUPABASE_ANON_KEY.'
          );

          setUser(null);
          setLoading(false);

          return;
        }

        // Load existing Supabase session
        const { data } = await supabase.auth.getSession();

        setUser(data.session?.user ?? null);
        setLoading(false);

        /*
         * Keep Supabase authentication state in sync.
         */
        const { data: listener } =
          supabase.auth.onAuthStateChange(
            (_event, session) => {
              setUser(session?.user ?? null);
            }
          );

        supabaseListener = listener;
      } catch (error) {
        console.error(
          'Authentication initialization error:',
          error
        );

        setUser(null);
        setLoading(false);
      }
    };

    initializeAuth();

    /*
     * Cleanup Supabase listener.
     */
    return () => {
      supabaseListener?.subscription?.unsubscribe();
    };
  }, []);

  /*
   * --------------------------------------------------------
   * SIGN OUT
   * --------------------------------------------------------
   *
   * For now, keep the existing Supabase sign-out behavior.
   * Catalyst logout will be connected in the next stage after
   * Catalyst login through the FarmVision UI is implemented.
   */
  const signOut = async () => {
    try {
      /*
       * If the current user came from Catalyst,
       * don't attempt to sign them out through Supabase.
       */
      if (user?.source === 'catalyst') {
        setUser(null);

        console.log('Catalyst user signed out locally.');

        return;
      }

      /*
       * Existing Supabase logout.
       */
      if (!supabase) {
        setUser(null);
        return;
      }

      await supabase.auth.signOut();

      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);

      setUser(null);
    }
  };

  /*
   * --------------------------------------------------------
   * AUTH METHODS
   * --------------------------------------------------------
   *
   * These methods remain Supabase-based for now.
   *
   * We will migrate Login.tsx to Catalyst in the next stage
   * only after this AuthProvider integration is confirmed.
   */

  const authMethods = {
    /*
     * Existing Supabase password login.
     */
    signInWithPassword: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      if (!supabase) {
        return {
          data: {
            user: null,
            session: null,
          },
          error: new Error('Supabase not connected'),
        };
      }

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      return {
        data,
        error,
      };
    },

    /*
     * Existing Supabase signup.
     *
     * IMPORTANT:
     * This also creates the matching farmers table row.
     */
    signUp: async ({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: any;
    }) => {
      if (!supabase) {
        return {
          data: {
            user: null,
            session: null,
          },
          error: new Error('Supabase not connected'),
        };
      }

      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
          options,
        });

      /*
       * Create matching farmer record.
       */
      if (data?.user && !error) {
        const { error: farmerError } =
          await supabase.from('farmers').insert({
            user_id: data.user.id,
            full_name:
              options?.data?.full_name ??
              email.split('@')[0],
            email,
          });

        if (farmerError) {
          console.error(
            'Could not create farmer record:',
            farmerError.message
          );
        }
      }

      return {
        data,
        error,
      };
    },

    /*
     * Existing Google login.
     */
    signInWithOAuth: async (options: any) => {
      if (!supabase) {
        return {
          error: new Error('Supabase not connected'),
        };
      }

      const { data, error } =
        await supabase.auth.signInWithOAuth(options);

      return {
        data,
        error,
      };
    },

    /*
     * Existing password reset.
     */
    resetPasswordForEmail: async (
      email: string,
      options?: any
    ) => {
      if (!supabase) {
        return {
          error: new Error('Supabase not connected'),
        };
      }

      const { data, error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          options
        );

      return {
        data,
        error,
      };
    },

    /*
     * Existing Supabase session method.
     */
    getSession: async () => {
      if (!supabase) {
        return {
          data: {
            session: null,
          },
          error: new Error('Supabase not connected'),
        };
      }

      return supabase.auth.getSession();
    },

    /*
     * Existing Supabase auth-state listener.
     */
    onAuthStateChange: (callback: any) => {
      if (!supabase) {
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        };
      }

      return supabase.auth.onAuthStateChange(callback);
    },

    /*
     * Existing Supabase sign-out method.
     */
    signOut: async () => {
      if (!supabase) {
        return {
          error: new Error('Supabase not connected'),
        };
      }

      const { error } =
        await supabase.auth.signOut();

      setUser(null);

      return {
        error,
      };
    },
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        auth: authMethods,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
