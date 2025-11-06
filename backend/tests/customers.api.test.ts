import request from 'supertest';
import { app } from '../src/app';
import { customerService } from '../src/services/customerService';
import { authUtils } from '../src/utils/auth';

// Mock the services
jest.mock('../src/config/database', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
  },
}));

jest.mock('../src/services/customerService');
jest.mock('../src/utils/auth');

const mockCustomerService = customerService as jest.Mocked<typeof customerService>;
const mockAuthUtils = authUtils as jest.Mocked<typeof authUtils>;

describe('Customers API', () => {
  let authToken: string;
  
  beforeAll(() => {
    // Mock authentication
    authToken = 'mock-jwt-token';
    mockAuthUtils.verifyToken.mockReturnValue({
      userId: 'user-123',
      role: 'editor',
      email: 'test@example.com'
    } as any);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/customers', () => {
    it('should create a new customer successfully', async () => {
      const mockCreatedCustomer = {
        id: 'customer-123',
        name: 'Minh Phu Seafood Corp',
        primary_contact_name: 'Nguyen Van Minh',
        primary_contact_phone: '+84-28-123-4567',
        email: 'minh@minhphu.com',
        address_text: 'Can Tho, Vietnam',
        latitude: 10.0452,
        longitude: 105.7469,
        country: 'Vietnam',
        province: 'Can Tho',
        district: 'Ninh Kieu',
        status: 'active' as const,
        credentials: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCustomerService.create.mockResolvedValue(mockCreatedCustomer);

      const customerData = {
        name: 'Minh Phu Seafood Corp',
        primaryContactName: 'Nguyen Van Minh',
        primaryContactPhone: '+84-28-123-4567',
        email: 'minh@minhphu.com',
        addressText: 'Can Tho, Vietnam',
        country: 'Vietnam',
        province: 'Can Tho',
        district: 'Ninh Kieu'
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Customer created successfully');
      expect(response.body.data.customer).toEqual(mockCreatedCustomer);
      expect(mockCustomerService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: customerData.name,
          primary_contact_name: customerData.primaryContactName,
          email: customerData.email,
        }),
        'user-123'
      );
    });

    it('should return 400 for invalid customer data', async () => {
      const invalidCustomerData = {
        // Missing required fields
        name: '',
        email: 'invalid-email-format',
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCustomerData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(mockCustomerService.create).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthorized requests', async () => {
      const customerData = {
        name: 'Test Customer',
        email: 'test@example.com',
      };

      await request(app)
        .post('/api/v1/customers')
        .send(customerData)
        .expect(401);

      expect(mockCustomerService.create).not.toHaveBeenCalled();
    });

    it('should handle duplicate email gracefully', async () => {
      mockCustomerService.create.mockRejectedValue(
        new Error('Customer with this email already exists')
      );

      const customerData = {
        name: 'Duplicate Customer',
        primaryContactName: 'John Doe',
        email: 'existing@example.com',
        addressText: 'Test Address',
        country: 'Vietnam'
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(mockCustomerService.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/customers', () => {
    it('should retrieve customers with pagination', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          name: 'Customer One',
          email: 'customer1@example.com',
          country: 'Vietnam',
          status: 'active',
          total_orders: 5,
          total_value: 12500.50,
        },
        {
          id: 'customer-2',
          name: 'Customer Two',
          email: 'customer2@example.com',
          country: 'Thailand',
          status: 'active',
          total_orders: 3,
          total_value: 7800.25,
        }
      ];

      mockCustomerService.search.mockResolvedValue({
        customers: mockCustomers,
        total: 2
      });

      const response = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customers).toEqual(mockCustomers);
      expect(response.body.data.pagination.total).toBe(2);
      expect(mockCustomerService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 0
        })
      );
    });

    it('should filter customers by country', async () => {
      const country = 'Vietnam';
      mockCustomerService.search.mockResolvedValue({
        customers: [],
        total: 0
      });

      await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ country })
        .expect(200);

      expect(mockCustomerService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          country
        })
      );
    });

    it('should search customers by name', async () => {
      const search = 'Minh Phu';
      mockCustomerService.search.mockResolvedValue({
        customers: [],
        total: 0
      });

      await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search })
        .expect(200);

      expect(mockCustomerService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          search
        })
      );
    });

    it('should filter customers by status', async () => {
      const status = 'paused';
      mockCustomerService.search.mockResolvedValue({
        customers: [],
        total: 0
      });

      await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status })
        .expect(200);

      expect(mockCustomerService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          status
        })
      );
    });
  });

  describe('GET /api/v1/customers/:id', () => {
    it('should retrieve a specific customer by ID', async () => {
      const customerId = 'customer-123';
      const mockCustomer = {
        id: customerId,
        name: 'Test Customer',
        primary_contact_name: 'John Doe',
        email: 'test@example.com',
        address_text: 'Test Address',
        country: 'Vietnam',
        status: 'active',
        credentials: [
          {
            id: 'cred-1',
            type: 'Business License',
            status: 'valid',
            expiry_date: '2024-12-31'
          }
        ],
        total_orders: 10,
        total_value: 25000.75,
        last_order_date: '2024-11-01'
      };

      mockCustomerService.getById.mockResolvedValue(mockCustomer);

      const response = await request(app)
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer).toEqual(mockCustomer);
      expect(mockCustomerService.getById).toHaveBeenCalledWith(customerId, true);
    });

    it('should return 404 for non-existent customer', async () => {
      const customerId = 'non-existent-customer';
      mockCustomerService.getById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/customers/:id', () => {
    it('should update an existing customer', async () => {
      const customerId = 'customer-123';
      const updateData = {
        name: 'Updated Customer Name',
        primaryContactPhone: '+84-28-999-8888',
        status: 'paused'
      };

      const mockUpdatedCustomer = {
        id: customerId,
        name: 'Updated Customer Name',
        primary_contact_name: 'John Doe',
        primary_contact_phone: '+84-28-999-8888',
        email: 'test@example.com',
        status: 'paused',
        updated_at: new Date(),
      };

      mockCustomerService.update.mockResolvedValue(mockUpdatedCustomer);

      const response = await request(app)
        .put(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer).toEqual(mockUpdatedCustomer);
      expect(mockCustomerService.update).toHaveBeenCalledWith(
        customerId,
        expect.objectContaining({
          name: updateData.name,
          primary_contact_phone: updateData.primaryContactPhone,
          status: updateData.status
        }),
        'user-123'
      );
    });

    it('should return 404 for updating non-existent customer', async () => {
      const customerId = 'non-existent';
      mockCustomerService.update.mockRejectedValue(
        new Error('Customer not found')
      );

      const response = await request(app)
        .put(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/customers/:id/analytics', () => {
    it('should retrieve customer analytics', async () => {
      const customerId = 'customer-123';
      const mockAnalytics = {
        customerId,
        summary: {
          totalOrders: 15,
          totalValue: 35000.50,
          averageOrderValue: 2333.37,
          lastOrderDate: '2024-11-01',
          daysSinceLastOrder: 3,
          retentionRisk: 'low' as const
        },
        performanceByPeriod: [
          { period: '2024-Q4', totalValue: 15000, orderCount: 6 }
        ],
        topSpecies: [
          { species: 'Penaeus vannamei', orderCount: 10, totalValue: 25000 }
        ],
        recentOrders: [],
        recentInvoices: [],
        credentialStatus: {
          total: 2,
          valid: 1,
          expiring: 1,
          expired: 0,
          credentials: []
        },
        timeline: [],
        warnings: []
      };

      mockCustomerService.getAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get(`/api/v1/customers/${customerId}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics).toEqual(mockAnalytics);
      expect(mockCustomerService.getAnalytics).toHaveBeenCalledWith(customerId);
    });
  });

  describe('POST /api/v1/customers/:id/credentials', () => {
    it('should upload customer credentials', async () => {
      const customerId = 'customer-123';
      
      mockCustomerService.addCredential.mockResolvedValue({
        id: 'cred-123',
        customer_id: customerId,
        type: 'Business License',
        number: 'BL-2024-001',
        status: 'valid',
        file_path: '/uploads/credentials/test-file.pdf',
        uploaded_at: new Date()
      });

      const response = await request(app)
        .post(`/api/v1/customers/${customerId}/credentials`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('type', 'Business License')
        .field('number', 'BL-2024-001')
        .field('issuedDate', '2024-01-01')
        .field('expiryDate', '2024-12-31')
        .attach('file', Buffer.from('fake pdf content'), 'license.pdf')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Credential uploaded successfully');
      expect(mockCustomerService.addCredential).toHaveBeenCalled();
    });

    it('should return 400 for missing required credential fields', async () => {
      const customerId = 'customer-123';

      const response = await request(app)
        .post(`/api/v1/customers/${customerId}/credentials`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('type', 'Business License')
        // Missing number, dates, and file
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(mockCustomerService.addCredential).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/customers/locations', () => {
    it('should retrieve customer locations for map display', async () => {
      const mockLocations = [
        {
          id: 'customer-1',
          name: 'Customer One',
          latitude: 10.7769,
          longitude: 106.7009,
          city: 'Ho Chi Minh City',
          country: 'Vietnam',
          status: 'active',
          credentialStatus: 'valid',
          orderCount: 5,
          revenue: 12500.50
        },
        {
          id: 'customer-2',
          name: 'Customer Two',
          latitude: 13.7563,
          longitude: 100.5018,
          city: 'Bangkok',
          country: 'Thailand',
          status: 'active',
          credentialStatus: 'expiring',
          orderCount: 3,
          revenue: 7800.25
        }
      ];

      mockCustomerService.getLocations.mockResolvedValue({
        locations: mockLocations,
        total: 2
      });

      const response = await request(app)
        .get('/api/v1/customers/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 100 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toEqual(mockLocations);
      expect(mockCustomerService.getLocations).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100
        })
      );
    });

    it('should filter locations by country', async () => {
      const country = 'Vietnam';
      mockCustomerService.getLocations.mockResolvedValue({
        locations: [],
        total: 0
      });

      await request(app)
        .get('/api/v1/customers/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ country })
        .expect(200);

      expect(mockCustomerService.getLocations).toHaveBeenCalledWith(
        expect.objectContaining({
          country
        })
      );
    });
  });

  describe('DELETE /api/v1/customers/:id', () => {
    it('should delete a customer (admin only)', async () => {
      // Mock user with admin role
      mockAuthUtils.verifyToken.mockReturnValueOnce({
        userId: 'user-123',
        role: 'admin',
        email: 'admin@example.com'
      } as any);

      const customerId = 'customer-123';
      mockCustomerService.delete.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Customer deleted successfully');
      expect(mockCustomerService.delete).toHaveBeenCalledWith(customerId);
    });

    it('should return 403 for insufficient permissions', async () => {
      // Mock user with editor role (insufficient for delete)
      mockAuthUtils.verifyToken.mockReturnValueOnce({
        userId: 'user-123',
        role: 'editor',
        email: 'editor@example.com'
      } as any);

      const customerId = 'customer-123';

      await request(app)
        .delete(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(mockCustomerService.delete).not.toHaveBeenCalled();
    });
  });
});