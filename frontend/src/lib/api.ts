import { z } from 'zod';

const rawBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
const apiPathFromEnv = (process.env.NEXT_PUBLIC_API_PATH || '/api/v1').trim();

const normalizePath = (value: string): string => {
  if (!value) {
    return '';
  }
  const trimmed = value.replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed ? `/${trimmed}` : '';
};

const buildApiBaseUrl = (base: string, apiPath: string): string => {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = normalizePath(apiPath);

  if (!normalizedPath) {
    return normalizedBase;
  }

  const lowerNormalizedPath = normalizedPath.toLowerCase();

  if (normalizedBase.toLowerCase().endsWith(lowerNormalizedPath)) {
    return normalizedBase;
  }

  // If the provided base URL already points to an API-like path, respect it as-is.
  try {
    const url = new URL(normalizedBase);
    const pathname = url.pathname.replace(/\/+$/, '').toLowerCase();
    if (pathname.endsWith('/api') || pathname.includes('/api/')) {
      return normalizedBase;
    }
  } catch {
    if (/\/api(\/|$)/i.test(normalizedBase)) {
      return normalizedBase;
    }
  }

  return `${normalizedBase}${normalizedPath}`;
};

// Base API configuration
const API_BASE_URL = buildApiBaseUrl(rawBaseUrl, apiPathFromEnv);

// Debug logging for Railway deployment
if (typeof console !== 'undefined') {
  console.log('🔧 API Configuration Debug:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    rawBaseUrl,
    apiPathFromEnv,
    finalApiBaseUrl: API_BASE_URL
  });
}

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    statusCode: number;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

// Authentication types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'manager' | 'admin';
  createdAt: string;
  lastLogin?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  primary_contact_name: string;
  primary_contact_phone?: string;
  email?: string;
  address_text?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  province?: string;
  district?: string;
  status: 'active' | 'paused' | 'blacklisted';
  credentials?: any[];
  created_at: string;
  updated_at: string;
  total_orders?: number;
  total_value?: number;
  last_order_date?: string;
  credential_status?: 'valid' | 'expiring' | 'expired' | 'missing';
}

// Order types
export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  order_date: string;
  species: string;
  strain?: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  total_value_currency: string;
  shipment_status: 'pending' | 'shipped' | 'delivered' | 'problem';
  quality_flag: 'ok' | 'minor_issue' | 'critical_issue';
  notes?: string;
  created_at: string;
  customer?: {
    id: string;
    name: string;
    primary_contact_name: string;
    country?: string;
  };
}

export type CustomerRetentionRisk = 'low' | 'medium' | 'high';
export type TimelineEventSeverity = 'info' | 'warning' | 'critical';

export interface CustomerAnalyticsWarning {
  code: string;
  message: string;
  severity: TimelineEventSeverity;
}

export interface CustomerAnalyticsSummary {
  totalOrders: number;
  totalValue: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  daysSinceLastOrder: number | null;
  averageDaysBetweenOrders: number | null;
  orderFrequencyPerQuarter: number | null;
  openShipmentCount: number;
  openIssuesCount: number;
  outstandingInvoiceValue: number;
  outstandingInvoiceCount: number;
  retentionRisk: CustomerRetentionRisk;
}

export interface CustomerAnalyticsPeriodPerformance {
  period: string;
  totalValue: number;
  orderCount: number;
  averageValue: number;
}

export interface CustomerAnalyticsSpeciesSummary {
  species: string;
  orderCount: number;
  totalQuantity: number;
  totalValue: number;
}

export interface CustomerAnalyticsOrderSnapshot {
  id: string;
  orderNumber: string;
  species: string;
  strain: string | null;
  orderDate: string;
  shipmentStatus: string;
  qualityFlag: string;
  totalValue: number;
  quantity: number;
  shipmentDate: string | null;
  shippedDate: string | null;
}

export interface CustomerAnalyticsInvoiceSnapshot {
  id: string;
  amount: number;
  currency: string;
  status: string;
  issuedDate: string;
  paidDate: string | null;
}

export interface CustomerAnalyticsCredentialSummary {
  id?: string;
  type: string;
  number?: string;
  status: 'valid' | 'expiring' | 'expired';
  issuedDate?: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
}

export interface CustomerAnalyticsCredentialStatus {
  total: number;
  valid: number;
  expiring: number;
  expired: number;
  nextExpiryDate?: string;
  credentials: CustomerAnalyticsCredentialSummary[];
}

export interface CustomerAnalyticsTimelineEvent {
  id: string;
  type: 'order' | 'shipment' | 'invoice' | 'payment' | 'credential' | 'note' | 'audit';
  timestamp: string;
  title: string;
  description?: string;
  relatedId?: string;
  relatedEntity?: string;
  severity: TimelineEventSeverity;
  metadata?: Record<string, unknown>;
}

export interface CustomerAnalytics {
  customerId: string;
  summary: CustomerAnalyticsSummary;
  performanceByPeriod: CustomerAnalyticsPeriodPerformance[];
  topSpecies: CustomerAnalyticsSpeciesSummary[];
  recentOrders: CustomerAnalyticsOrderSnapshot[];
  recentInvoices: CustomerAnalyticsInvoiceSnapshot[];
  credentialStatus: CustomerAnalyticsCredentialStatus;
  timeline: CustomerAnalyticsTimelineEvent[];
  warnings: CustomerAnalyticsWarning[];
}

// API Client class
export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  get hasToken(): boolean {
    return Boolean(this.token);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getToken(): string | null {
    return this.token;
  }

  private loadToken(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken');
    }
  }

  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>).Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data: ApiResponse<T>;
      
      try {
        data = await response.json();
      } catch {
        // Handle non-JSON responses
        data = {
          success: false,
          error: {
            message: 'Invalid response format',
            statusCode: response.status,
          },
        };
      }

      if (!response.ok) {
        // Handle 401 specifically for token refresh
        if (response.status === 401 && this.token) {
          await this.refreshToken();
          // Retry the request once with new token
          return this.request(endpoint, options);
        }
        
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Network error');
    }
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refreshToken') 
      : null;

    if (!refreshToken) {
      this.clearToken();
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const { accessToken, refreshToken: newRefreshToken } = data.data.tokens;
      
      this.setToken(accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
    } catch (error) {
      this.clearToken();
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.request<{ user: User; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data) {
      this.setToken(response.data.tokens.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      }
    }

    return response.data!;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me');
    return response.data!.user;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  // Customer methods
  async getCustomers(params: any = {}): Promise<PaginatedResponse<Customer>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const response = await this.request<{ customers: Customer[]; pagination: any }>(
      `/customers?${searchParams}`
    );

    return {
      items: response.data!.customers,
      pagination: response.data!.pagination,
    };
  }

  async getCustomer(id: string): Promise<Customer> {
    const response = await this.request<{ customer: Customer }>(`/customers/${id}`);
    return response.data!.customer;
  }

  async getCustomerOrders(
    customerId: string,
    params: Record<string, string | number | undefined> = {}
  ): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const response = await this.request<{
      orders: Order[];
      pagination: PaginatedResponse<Order>['pagination'];
    }>(`/orders/customer/${customerId}?${searchParams}`);

    return {
      items: response.data!.orders,
      pagination: response.data!.pagination,
    };
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const response = await this.request<{ customer: Customer }>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!.customer;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const response = await this.request<{ customer: Customer }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!.customer;
  }

  async getCustomerStats(): Promise<any> {
    const response = await this.request('/customers/stats/summary');
    return response.data;
  }

  async getCustomerAnalytics(id: string): Promise<CustomerAnalytics> {
    const response = await this.request<{ analytics: CustomerAnalytics }>(`/customers/${id}/analytics`);
    return response.data!.analytics;
  }

  // Order methods
  async getOrders(params: any = {}): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const response = await this.request<{ orders: Order[]; pagination: any }>(
      `/orders?${searchParams}`
    );

    return {
      items: response.data!.orders,
      pagination: response.data!.pagination,
    };
  }

  async getOrder(id: string): Promise<Order> {
    const response = await this.request<{ order: Order }>(`/orders/${id}`);
    return response.data!.order;
  }

  async createOrder(data: Partial<Order>): Promise<Order> {
    const response = await this.request<{ order: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!.order;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    const response = await this.request<{ order: Order }>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!.order;
  }

  async getOrderStats(): Promise<any> {
    const response = await this.request('/orders/stats/summary');
    return response.data;
  }

  async getRevenueByMonth(months: number = 12): Promise<any> {
    const response = await this.request(`/orders/stats/revenue-by-month?months=${months}`);
    return response.data;
  }

  async getTopSpecies(limit: number = 10, periodDays: number = 30): Promise<any> {
    const response = await this.request(`/orders/stats/top-species?limit=${limit}&period_days=${periodDays}`);
    return response.data;
  }

  // Broodstock batch methods
  async getBatches(params: any = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const response = await this.request(`/broodstock-batches?${searchParams}`);
    return response.data;
  }

  async getBatchStats(): Promise<any> {
    const response = await this.request('/broodstock-batches/stats');
    return response.data;
  }

  // Business logic methods
  async calculateOrder(data: any): Promise<any> {
    const response = await this.request('/business/calculate-order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getRecommendedPricing(data: any): Promise<any> {
    const response = await this.request('/business/recommended-pricing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Dashboard methods
  async getDashboardStats(range: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<any> {
    const response = await this.request(`/business/dashboard-stats?range=${range}`);
    return response.data;
  }

  async getRevenueAnalytics(
    range: '7d' | '30d' | '90d' | '1y' = '30d',
    granularity: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<any> {
    const response = await this.request(`/business/revenue-analytics?range=${range}&granularity=${granularity}`);
    return response.data;
  }

  async getCustomerLocations(params: {
    bounds?: string;
    zoom?: number;
    limit?: number;
  } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    const response = await this.request(`/business/customer-locations?${searchParams}`);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}/health`);
    return response.json();
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export commonly used schemas for validation
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const CustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  primary_contact_name: z.string().min(2, 'Contact name must be at least 2 characters'),
  primary_contact_phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address_text: z.string().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
});

export const OrderSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  species: z.string().min(1, 'Species is required'),
  strain: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be positive'),
  order_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  shipment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  notes: z.string().optional(),
});
