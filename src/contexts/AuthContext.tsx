/**
 * AuthContext.tsx - Authentication State Management
 * 
 * This context provides authentication state and methods throughout the app.
 * It handles user login, signup, logout, and stores the current user's profile and role.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Profile } from '@/types/database';

// Define what data and methods are available from this context
interface AuthContextType {
  user: User | null;           // Supabase auth user object
  session: Session | null;     // Current auth session
  profile: Profile | null;     // User's profile data (name, email)
  role: AppRole | null;        // User's role (admin, department_head, employee)
  loading: boolean;            // True while fetching auth state
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;            // Convenience check for admin role
  isDepartmentHead: boolean;   // Convenience check for department head role
  isEmployee: boolean;         // Convenience check for employee role
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - Wraps the app to provide auth state to all components
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // State for auth data
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth changes on mount
  useEffect(() => {
    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch additional user data when logged in
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          // Clear data when logged out
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Fetch user's profile and role from database
   */
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile and role in parallel for speed
      const [profileResult, roleResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId).single()
      ]);

      if (profileResult.data) setProfile(profileResult.data as Profile);
      if (roleResult.data) setRole(roleResult.data.role as AppRole);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  /** Sign in with email and password */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  /** Create new account with email, password, and name */
  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName } // Stored in user metadata
      }
    });
    return { error };
  };

  /** Sign out and clear all auth state */
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  // Provide all auth state and methods to children
  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      loading,
      signIn,
      signUp,
      signOut,
      isAdmin: role === 'admin',
      isDepartmentHead: role === 'department_head',
      isEmployee: role === 'employee'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth - Hook to access auth context
 * Must be used inside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
