import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types';
import { AUTH_TOKEN_KEY } from '../utils/constants';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// In a real app, API calls would be made to a backend service
// For demo purposes, we're mocking authentication with dummy data
const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Demo credentials
          if (email === 'admin@rhdp.ci' && password === 'password') {
            const user: User = {
              id: '1',
              email: 'admin@rhdp.ci',
              firstName: 'Admin',
              lastName: 'RHDP',
              role: 'admin',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            const token = 'mock-jwt-token-for-demo';
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            
            localStorage.setItem(AUTH_TOKEN_KEY, token);
          } else if (email === 'user@rhdp.ci' && password === 'password') {
            const user: User = {
              id: '2',
              email: 'user@rhdp.ci',
              firstName: 'Utilisateur',
              lastName: 'RHDP',
              role: 'user',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            const token = 'mock-jwt-token-for-demo-user';
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            
            localStorage.setItem(AUTH_TOKEN_KEY, token);
          } else {
            set({
              isLoading: false,
              error: 'Identifiants invalides',
            });
          }
        } catch {
// error intentionally ignored (used for set)
          set({
            isLoading: false,
            error: 'Une erreur est survenue lors de la connexion',
          });
        }
      },

      register: async () => { // userData intentionally unused for mock
        set({ isLoading: true, error: null });
        
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // In a real app, you would create the user in your backend
          // For demo, just return success
          set({ isLoading: false });
        } catch {
// error intentionally ignored (used for set)
          set({
            isLoading: false,
            error: 'Une erreur est survenue lors de l\'inscription',
          });
        }
      },

      logout: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;