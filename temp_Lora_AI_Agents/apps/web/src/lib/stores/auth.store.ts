import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '../supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;          // local DB UUID (returned by NestJS /auth/me)
  supabaseId: string;
  email: string;
  name?: string;
  plan: string;
  avatarUrl?: string;
  onboardingComplete?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  enableLocalMode: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  syncFromSupabase: (supabaseUser: SupabaseUser) => Promise<void>;
  reset: () => void;
}

const LOCAL_DEV_USER: AuthUser = {
  id: 'local-dev-user',
  supabaseId: 'local-dev-user',
  email: 'local@loraloop.dev',
  name: 'Local Developer',
  plan: 'FREE',
  onboardingComplete: true,
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  enableLocalMode: () => {
    set({ user: LOCAL_DEV_USER, isAuthenticated: true, isLoading: false });
  },

  login: async (email, password) => {
    if (!isSupabaseConfigured) {
      set({
        user: {
          ...LOCAL_DEV_USER,
          email: email || LOCAL_DEV_USER.email,
        },
        isAuthenticated: true,
        isLoading: false,
      });
      return;
    }
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, name) => {
    if (!isSupabaseConfigured) {
      set({
        user: {
          ...LOCAL_DEV_USER,
          email: email || LOCAL_DEV_USER.email,
          name: name || LOCAL_DEV_USER.name,
        },
        isAuthenticated: true,
        isLoading: false,
      });
      return;
    }
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw new Error(error.message);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    if (!isSupabaseConfigured) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  syncFromSupabase: async (supabaseUser: SupabaseUser) => {
    if (!isSupabaseConfigured) {
      set({
        user: {
          id: '',
          supabaseId: supabaseUser.id,
          email: supabaseUser.email ?? '',
          plan: 'FREE',
        },
        isAuthenticated: true,
      });
      return;
    }
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/v1/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const profile = res.ok ? await res.json() : {};

      set({
        user: {
          id: profile.id ?? '',
          supabaseId: supabaseUser.id,
          email: supabaseUser.email ?? '',
          name: supabaseUser.user_metadata?.full_name ?? profile.name,
          plan: profile.plan ?? 'FREE',
          avatarUrl: supabaseUser.user_metadata?.avatar_url ?? profile.avatarUrl,
          onboardingComplete: profile.onboardingComplete ?? true,
        },
        isAuthenticated: true,
      });
    } catch {
      set({
        user: {
          id: '',
          supabaseId: supabaseUser.id,
          email: supabaseUser.email ?? '',
          plan: 'FREE',
        },
        isAuthenticated: true,
      });
    }
  },

  reset: () => set({ user: null, isAuthenticated: false }),
}));
