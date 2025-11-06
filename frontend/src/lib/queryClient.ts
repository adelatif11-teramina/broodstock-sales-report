import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

// Create query client with global configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 401 (which is handled by API client)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 401) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      console.error('Query error:', error, 'Query key:', query.queryKey);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any, variables, context, mutation) => {
      console.error('Mutation error:', error, 'Variables:', variables);
    },
  }),
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Authentication
  currentUser: ['auth', 'currentUser'] as const,
  
  // Customers
  customers: ['customers'] as const,
  customer: (id: string) => ['customers', id] as const,
  customerAnalytics: (id: string) => ['customers', 'analytics', id] as const,
  customerStats: ['customers', 'stats'] as const,
  nearbyCustomers: (lat: number, lng: number, radius: number) => 
    ['customers', 'nearby', lat, lng, radius] as const,
  
  // Orders
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
  orderStats: ['orders', 'stats'] as const,
  revenueByMonth: (months: number) => ['orders', 'revenue', months] as const,
  topSpecies: (limit: number, days: number) => ['orders', 'species', limit, days] as const,
  customerOrders: (customerId: string) => ['orders', 'customer', customerId] as const,
  
  // Broodstock Batches
  batches: ['batches'] as const,
  batch: (id: string) => ['batches', id] as const,
  batchStats: ['batches', 'stats'] as const,
  availableBatches: ['batches', 'available'] as const,
  lowStockBatches: (threshold: number) => ['batches', 'lowStock', threshold] as const,
  
  // Business Logic
  recommendedPricing: (species: string, quantity: number, customerId?: string) => 
    ['business', 'pricing', species, quantity, customerId] as const,
  customerTier: (customerId: string) => ['business', 'tier', customerId] as const,
  orderCalculation: (data: any) => ['business', 'calculate', data] as const,
  
  // Dashboard
  dashboardStats: ['dashboard', 'stats'] as const,
  dashboardCharts: ['dashboard', 'charts'] as const,
  salesChart: ['dashboard', 'salesChart'] as const,
  customerLocations: ['dashboard', 'customerLocations'] as const,
} as const;

// Utility functions for invalidating related queries
export const invalidateQueries = {
  customers: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers }),
  orders: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
  batches: () => queryClient.invalidateQueries({ queryKey: queryKeys.batches }),
  stats: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.customerStats });
    queryClient.invalidateQueries({ queryKey: queryKeys.orderStats });
    queryClient.invalidateQueries({ queryKey: queryKeys.batchStats });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
  },
  all: () => queryClient.invalidateQueries(),
};

// Prefetch utilities
export const prefetchQueries = {
  dashboardData: async () => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.orderStats,
        queryFn: () => import('../lib/api').then(({ apiClient }) => apiClient.getOrderStats()),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.customerStats,
        queryFn: () => import('../lib/api').then(({ apiClient }) => apiClient.getCustomerStats()),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.batchStats,
        queryFn: () => import('../lib/api').then(({ apiClient }) => apiClient.getBatchStats()),
      }),
    ]);
  },
};
