import { supabase } from '../lib/supabase';
import { PlatformType } from '../types';

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
}

export interface CommunityGameStat {
  name: string;
  count: number;
  platforms: PlatformType[];
  latestPlayer: string;
}

export const authService = {
  // Sign Up with Supabase
  register: async (username: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      // 1. Sign up auth user
      const { data, error } = await (supabase.auth as any).signUp({
        email,
        password,
      });

      if (error) return { success: false, message: error.message };
      if (!data.user) return { success: false, message: 'Registration failed.' };

      // 2. Create profile entry (username)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, username: username }]);

      if (profileError) {
        // Warning: User created but profile failed. 
        console.error('Profile creation error:', profileError);
        return { success: true, message: 'Account created, but username failed to save.' };
      }

      return { success: true, message: 'Registration successful! You can now login.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Unknown error' };
    }
  },

  // Login with Supabase
  login: async (usernameOrEmail: string, password: string): Promise<{ success: boolean; message: string; user?: UserProfile }> => {
    try {
      // Supabase uses Email for login by default
      // If user entered a plain username, this demo assumes they entered an email. 
      // Real implementation might need to lookup email by username first, but that requires extra permissions.
      // For simplicity, we assume the input is Email.
      
      const { data, error } = await (supabase.auth as any).signInWithPassword({
        email: usernameOrEmail,
        password,
      });

      if (error) return { success: false, message: error.message };
      if (!data.user) return { success: false, message: 'Login failed' };

      // Fetch Profile for Username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single();

      const userProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email,
        username: profile?.username || usernameOrEmail.split('@')[0], // Fallback if no profile
      };

      return { success: true, message: 'Login successful', user: userProfile };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  logout: async () => {
    await (supabase.auth as any).signOut();
  },

  resetPasswordRequest: async (email: string): Promise<{ success: boolean; message: string }> => {
    const { error } = await (supabase.auth as any).resetPasswordForEmail(email);
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'If registered, a password reset email has been sent.' };
  },

  // Update password (must be logged in)
  changePassword: async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    const { error } = await (supabase.auth as any).updateUser({ password: newPassword });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Password updated successfully' };
  },
  
  // Get current session
  getCurrentUser: async (): Promise<UserProfile | null> => {
    const { data: { session } } = await (supabase.auth as any).getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();

    return {
        id: session.user.id,
        email: session.user.email,
        username: profile?.username || session.user.email?.split('@')[0] || 'User'
    };
  }
};