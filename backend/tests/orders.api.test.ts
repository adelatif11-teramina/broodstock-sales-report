import request from 'supertest';
import app from '../src/app';
import { orderService } from '../src/services/orderService';

// Mock the database and services
jest.mock('../src/config/database', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
  },
}));

jest.mock('../src/services/orderService');

const mockOrderService = orderService as jest.Mocked<typeof orderService>;

describe('Orders API', () => {
  let authToken: string;
  
  beforeAll(() => {
    // Create a valid JWT token for testing
    authToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJlZGl0b3IiLCJpYXQiOjE2MzQ2MzQ0MDAsImV4cCI6MTYzNDYzNTAwMH0.test-signature';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/orders', () => {
    it('should create a new order successfully', async () => {
      // Mock order creation
      const mockCreatedOrder = {
        id: 'order-123',
        order_number: 'PO-2024-001',
        customer_id: 'customer-456',
        species: 'Penaeus vannamei',
        strain: 'SPF Line A',
        quantity: 1000,
        unit_price: 0.85,
        total_value: 850,
        unit_price_currency: 'USD',
        total_value_currency: 'USD',
        unit: 'pieces',
        order_date: '2024-11-04',
        shipment_status: 'pending' as const,
        quality_flag: 'ok' as const,
        mortality_reported: 0,
        test_results: [],
        files: [],
        notes: 'Test order',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockOrderService.create.mockResolvedValue(mockCreatedOrder);

      const orderData = {
        customerId: 'customer-456',
        species: 'Penaeus vannamei',
        strain: 'SPF Line A',
        quantity: 1000,
        unit: 'pieces',
        unitPrice: 0.85,
        currency: 'USD',
        deliveryAddress: {
          street: '123 Ocean Ave',
          city: 'Ho Chi Minh City',
          state: 'Ho Chi Minh',
          country: 'Vietnam',
          postalCode: '70000'
        },
        notes: 'Test order creation'
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order created successfully');
      expect(response.body.data.order).toEqual(mockCreatedOrder);
      expect(mockOrderService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: orderData.customerId,
          species: orderData.species,
          quantity: orderData.quantity,
          unit_price: orderData.unitPrice,
        }),
        'user-123'
      );
    });

    it('should return 400 for invalid order data', async () => {
      const invalidOrderData = {
        // Missing required fields
        species: 'Penaeus vannamei',
        quantity: -1, // Invalid quantity
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOrderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(mockOrderService.create).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthorized requests', async () => {
      const orderData = {
        customerId: 'customer-456',
        species: 'Penaeus vannamei',
        quantity: 1000,
      };

      await request(app)
        .post('/api/v1/orders')
        .send(orderData)
        .expect(401);

      expect(mockOrderService.create).not.toHaveBeenCalled();
    });

    it('should return 403 for insufficient permissions', async () => {
      // Mock user with viewer role (insufficient permissions)
      mockAuthUtils.verifyToken.mockReturnValueOnce({
        userId: 'user-456',
        role: 'viewer',
        email: 'viewer@example.com'
      } as any);

      const orderData = {
        customerId: 'customer-456',
        species: 'Penaeus vannamei',
        quantity: 1000,
      };

      await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(403);

      expect(mockOrderService.create).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      mockOrderService.create.mockRejectedValue(new Error('Database connection failed'));

      const orderData = {
        customerId: 'customer-456',
        species: 'Penaeus vannamei',
        strain: 'SPF Line A',
        quantity: 1000,
        unit: 'pieces',
        unitPrice: 0.85,
        currency: 'USD',
        deliveryAddress: {
          street: '123 Ocean Ave',
          city: 'Ho Chi Minh City',
          state: 'Ho Chi Minh',
          country: 'Vietnam',
          postalCode: '70000'
        }
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(mockOrderService.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/orders', () => {
    it('should retrieve orders with pagination', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          order_number: 'PO-2024-001',
          customer_id: 'customer-1',
          species: 'Penaeus vannamei',
          quantity: 1000,
          total_value: 850,
          order_date: '2024-11-04',
          shipment_status: 'pending',
        },
        {
          id: 'order-2',
          order_number: 'PO-2024-002',
          customer_id: 'customer-2',
          species: 'Penaeus monodon',
          quantity: 500,
          total_value: 625,
          order_date: '2024-11-03',
          shipment_status: 'shipped',
        }
      ];

      mockOrderService.search.mockResolvedValue({
        orders: mockOrders,
        total: 2
      });

      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toEqual(mockOrders);
      expect(response.body.data.pagination.total).toBe(2);
      expect(mockOrderService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 0
        })
      );
    });

    it('should filter orders by customer', async () => {
      const customerId = 'customer-123';
      mockOrderService.search.mockResolvedValue({
        orders: [],
        total: 0
      });

      await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ customer_id: customerId })
        .expect(200);

      expect(mockOrderService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: customerId
        })
      );
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should retrieve a specific order by ID', async () => {
      const orderId = 'order-123';
      const mockOrder = {
        id: orderId,
        order_number: 'PO-2024-001',
        customer_id: 'customer-456',
        species: 'Penaeus vannamei',
        quantity: 1000,
        total_value: 850,
        order_date: '2024-11-04',
        shipment_status: 'pending',
      };

      mockOrderService.getById.mockResolvedValue(mockOrder);

      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toEqual(mockOrder);
      expect(mockOrderService.getById).toHaveBeenCalledWith(orderId, true);
    });

    it('should return 404 for non-existent order', async () => {
      const orderId = 'non-existent-order';
      mockOrderService.getById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/orders/:id', () => {
    it('should update an existing order', async () => {
      const orderId = 'order-123';
      const updateData = {
        quantity: 1500,
        unitPrice: 0.90,
        notes: 'Updated order'
      };

      const mockUpdatedOrder = {
        id: orderId,
        order_number: 'PO-2024-001',
        customer_id: 'customer-456',
        species: 'Penaeus vannamei',
        quantity: 1500,
        unit_price: 0.90,
        total_value: 1350,
        notes: 'Updated order',
        updated_at: new Date(),
      };

      mockOrderService.update.mockResolvedValue(mockUpdatedOrder);

      const response = await request(app)
        .put(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toEqual(mockUpdatedOrder);
      expect(mockOrderService.update).toHaveBeenCalledWith(
        orderId,
        expect.objectContaining({
          quantity: updateData.quantity,
          unit_price: updateData.unitPrice,
          notes: updateData.notes
        }),
        'user-123'
      );
    });
  });

  describe('DELETE /api/v1/orders/:id', () => {
    it('should delete an order (manager/admin only)', async () => {
      // Mock user with manager role
      mockAuthUtils.verifyToken.mockReturnValueOnce({
        userId: 'user-123',
        role: 'manager',
        email: 'manager@example.com'
      } as any);

      const orderId = 'order-123';
      mockOrderService.delete.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order deleted successfully');
      expect(mockOrderService.delete).toHaveBeenCalledWith(orderId);
    });

    it('should return 403 for insufficient permissions', async () => {
      // Mock user with editor role (insufficient for delete)
      mockAuthUtils.verifyToken.mockReturnValueOnce({
        userId: 'user-123',
        role: 'editor',
        email: 'editor@example.com'
      } as any);

      const orderId = 'order-123';

      await request(app)
        .delete(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(mockOrderService.delete).not.toHaveBeenCalled();
    });
  });
});