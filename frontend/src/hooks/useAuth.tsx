import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, User, LoginCredentials } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import ClientOnly from '@/components/ClientOnly';
import React from 'react';

// Auth store for client-side state management
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Custom hook for authentication logic
export function useAuth() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore();

  // Query for current user (runs automatically if token exists)
  const {
    data: currentUser,
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => apiClient.getCurrentUser(),
    enabled: apiClient.hasToken && !user, // Only fetch if we have a token but no user
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => apiClient.login(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(queryKeys.currentUser, data.user);
      // Prefetch dashboard data after login
      queryClient.prefetchQuery({
        queryKey: queryKeys.orderStats,
        queryFn: () => apiClient.getOrderStats(),
      });
    },
    onError: (error) => {
      console.error('Login failed:', error);
      clearAuth();
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiClient.logout(),
    onSettled: () => {
      // Clear everything regardless of API call success
      clearAuth();
      apiClient.clearToken();
      queryClient.clear();
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
  });

  // Check if user has specific role or permission
  const hasRole = (requiredRole: User['role'] | User['role'][]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  };

  // Check if user can perform specific actions
  const canEdit = hasRole(['editor', 'manager', 'admin']);
  const canManage = hasRole(['manager', 'admin']);
  const canAdmin = hasRole(['admin']);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    return loginMutation.mutateAsync(credentials);
  };

  // Logout function
  const logout = () => {
    logoutMutation.mutate();
  };

  // Initialize auth state on mount
  React.useEffect(() => {
    if (!user && apiClient.hasToken && !isLoadingUser) {
      refetchUser();
    }
  }, [user, isLoadingUser, refetchUser]);

  return {
    // State
    user: user || currentUser,
    isAuthenticated: isAuthenticated && !!user,
    isLoadingUser,
    
    // Actions
    login,
    logout,
    refetchUser,
    
    // Permissions
    hasRole,
    canEdit,
    canManage,
    canAdmin,
    
    // Loading states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    
    // Errors
    loginError: loginMutation.error,
    userError,
  };
}

// HOC for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: User['role'] | User['role'][]
) {
  return function AuthenticatedComponent(props: P) {
    const AuthContent = () => {
      const { isAuthenticated, hasRole, isLoadingUser } = useAuth();

      // Show loading spinner while checking auth
      if (isLoadingUser) {
        return React.createElement('div', 
          { className: "min-h-screen flex items-center justify-center" },
          React.createElement('div', { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" })
        );
      }

      // Redirect to login if not authenticated
      if (!isAuthenticated) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return React.createElement('div', 
          { className: "min-h-screen flex items-center justify-center" },
          React.createElement('div', { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" })
        );
      }

      // Check role permission if required
      if (requiredRole && !hasRole(requiredRole)) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to access this page.</p>
            </div>
          </div>
        );
      }

      return <Component {...props} />;
    };

    return (
      <ClientOnly
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        }
      >
        <AuthContent />
      </ClientOnly>
    );
  };
}

// Hook for protecting individual components
export function useRequireAuth(requiredRole?: User['role'] | User['role'][]) {
  const { isAuthenticated, hasRole, isLoadingUser } = useAuth();

  const canAccess = React.useMemo(() => {
    if (isLoadingUser) return null; // Loading state
    if (!isAuthenticated) return false;
    if (requiredRole && !hasRole(requiredRole)) return false;
    return true;
  }, [isAuthenticated, hasRole, requiredRole, isLoadingUser]);

  return {
    canAccess,
    isLoading: isLoadingUser,
    isAuthenticated,
  };
}
