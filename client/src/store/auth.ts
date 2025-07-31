import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
        });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      login: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      clearError: () => {
        // This can be used for error handling if needed
        set({ isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors for convenient access
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    setLoading,
    updateUser,
    clearError,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    setLoading,
    updateUser,
    clearError,
  };
};

// Helper functions for cookie-based auth
export const getAuthHeaders = () => {
  // No need for headers since cookies are automatically sent
  return {};
};

// Note: These functions are not applicable for httpOnly cookies
// since JavaScript cannot access them directly
export const isTokenExpired = (): boolean => {
  // Cannot check token expiry with httpOnly cookies
  // The server will handle token validation
  return false;
};

export const shouldRefreshToken = (): boolean => {
  // Cannot check token expiry with httpOnly cookies
  // The axios interceptor will handle refresh on 401 responses
  return false;
};
