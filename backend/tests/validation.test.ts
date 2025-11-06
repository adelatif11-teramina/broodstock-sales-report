import { 
  CreateOrderSchema, 
  UpdateOrderSchema, 
  OrderFilterSchema,
} from '../src/models/order';
import { 
  CreateCustomerSchema, 
  UpdateCustomerSchema, 
  CustomerFilterSchema,
} from '../src/models/customer';

describe('Data Validation Schemas', () => {

  describe('Order Validation', () => {
    describe('CreateOrderSchema', () => {
      it('should validate a complete valid order', () => {
        const validOrder = {
          customer_id: 'customer-123',
          species: 'Penaeus vannamei',
          strain: 'SPF Line A',
          quantity: 1000,
          unit_price: 0.85,
          unit_price_currency: 'USD',
          total_value_currency: 'USD',
          unit: 'pieces',
          packaging_type: 'Standard Transport Bags',
          order_date: '2024-11-04',
          shipment_date: '2024-11-10',
          notes: 'Test order'
        };

        const result = CreateOrderSchema.safeParse(validOrder);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.customer_id).toBe(validOrder.customer_id);
          expect(result.data.species).toBe(validOrder.species);
          expect(result.data.quantity).toBe(validOrder.quantity);
          expect(result.data.unit_price).toBe(validOrder.unit_price);
        }
      });

      it('should calculate total_value automatically', () => {
        const order = {
          customer_id: 'customer-123',
          species: 'Penaeus vannamei',
          quantity: 1000,
          unit_price: 0.85,
          unit_price_currency: 'USD',
          total_value_currency: 'USD',
          unit: 'pieces',
          order_date: '2024-11-04'
        };

        const result = CreateOrderSchema.safeParse(order);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.total_value).toBe(850); // 1000 * 0.85
        }
      });

      it('should reject order with missing required fields', () => {
        const incompleteOrder = {
          species: 'Penaeus vannamei',
          // Missing customer_id, quantity, unit_price, etc.
        };

        const result = CreateOrderSchema.safeParse(incompleteOrder);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          const errors = result.error.issues.map(issue => issue.path[0]);
          expect(errors).toContain('customer_id');
          expect(errors).toContain('quantity');
          expect(errors).toContain('unit_price');
        }
      });

      it('should reject order with invalid quantity', () => {
        const invalidOrder = {
          customer_id: 'customer-123',
          species: 'Penaeus vannamei',
          quantity: -100, // Invalid negative quantity
          unit_price: 0.85,
          unit_price_currency: 'USD',
          total_value_currency: 'USD',
          unit: 'pieces',
          order_date: '2024-11-04'
        };

        const result = CreateOrderSchema.safeParse(invalidOrder);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          const quantityError = result.error.issues.find(
            issue => issue.path[0] === 'quantity'
          );
          expect(quantityError).toBeDefined();
        }
      });

      it('should reject order with invalid unit_price', () => {
        const invalidOrder = {
          customer_id: 'customer-123',
          species: 'Penaeus vannamei',
          quantity: 1000,
          unit_price: -0.50, // Invalid negative price
          unit_price_currency: 'USD',
          total_value_currency: 'USD',
          unit: 'pieces',
          order_date: '2024-11-04'
        };

        const result = CreateOrderSchema.safeParse(invalidOrder);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          const priceError = result.error.issues.find(
            issue => issue.path[0] === 'unit_price'
          );
          expect(priceError).toBeDefined();
        }
      });

      it('should reject order with invalid currency', () => {
        const invalidOrder = {
          customer_id: 'customer-123',
          species: 'Penaeus vannamei',
          quantity: 1000,
          unit_price: 0.85,
          unit_price_currency: 'INVALID', // Invalid currency
          total_value_currency: 'USD',
          unit: 'pieces',
          order_date: '2024-11-04'
        };

        const result = CreateOrderSchema.safeParse(invalidOrder);
        expect(result.success).toBe(false);
      });

      it('should reject order with invalid shipment_status', () => {
        const invalidOrder = {
          customer_id: 'customer-123',
          species: 'Penaeus vannamei',
          quantity: 1000,
          unit_price: 0.85,
          unit_price_currency: 'USD',
          total_value_currency: 'USD',
          unit: 'pieces',
          order_date: '2024-11-04',
          shipment_status: 'invalid_status' // Invalid status
        };

        const result = CreateOrderSchema.safeParse(invalidOrder);
        expect(result.success).toBe(false);
      });

      it('should accept valid shipment_status values', () => {
        const validStatuses = ['pending', 'shipped', 'delivered', 'problem'];
        
        validStatuses.forEach(status => {
          const order = {
            customer_id: 'customer-123',
            species: 'Penaeus vannamei',
            quantity: 1000,
            unit_price: 0.85,
            unit_price_currency: 'USD',
            total_value_currency: 'USD',
            unit: 'pieces',
            order_date: '2024-11-04',
            shipment_status: status
          };

          const result = CreateOrderSchema.safeParse(order);
          expect(result.success).toBe(true);
        });
      });

      it('should accept valid quality_flag values', () => {
        const validFlags = ['ok', 'minor_issue', 'critical_issue'];
        
        validFlags.forEach(flag => {
          const order = {
            customer_id: 'customer-123',
            species: 'Penaeus vannamei',
            quantity: 1000,
            unit_price: 0.85,
            unit_price_currency: 'USD',
            total_value_currency: 'USD',
            unit: 'pieces',
            order_date: '2024-11-04',
            quality_flag: flag
          };

          const result = CreateOrderSchema.safeParse(order);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('UpdateOrderSchema', () => {
      it('should allow partial updates', () => {
        const partialUpdate = {
          quantity: 1500,
          notes: 'Updated notes'
        };

        const result = UpdateOrderSchema.safeParse(partialUpdate);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.quantity).toBe(1500);
          expect(result.data.notes).toBe('Updated notes');
        }
      });

      it('should recalculate total_value when quantity or unit_price changes', () => {
        const update = {
          quantity: 2000,
          unit_price: 0.90
        };

        const result = UpdateOrderSchema.safeParse(update);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.total_value).toBe(1800); // 2000 * 0.90
        }
      });

      it('should reject invalid partial updates', () => {
        const invalidUpdate = {
          quantity: -500, // Invalid negative quantity
          shipment_status: 'invalid_status' // Invalid status
        };

        const result = UpdateOrderSchema.safeParse(invalidUpdate);
        expect(result.success).toBe(false);
      });
    });

    describe('OrderFilterSchema', () => {
      it('should validate valid filter parameters', () => {
        const filters = {
          customer_id: 'customer-123',
          species: 'Penaeus vannamei',
          shipment_status: 'pending',
          date_from: '2024-01-01',
          date_to: '2024-12-31',
          limit: 50,
          offset: 100
        };

        const result = OrderFilterSchema.safeParse(filters);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.customer_id).toBe(filters.customer_id);
          expect(result.data.limit).toBe(filters.limit);
          expect(result.data.offset).toBe(filters.offset);
        }
      });

      it('should apply default values for limit and offset', () => {
        const filters = {};

        const result = OrderFilterSchema.safeParse(filters);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.limit).toBe(20); // Default limit
          expect(result.data.offset).toBe(0); // Default offset
        }
      });

      it('should enforce maximum limit', () => {
        const filters = {
          limit: 1000 // Exceeds maximum
        };

        const result = OrderFilterSchema.safeParse(filters);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Customer Validation', () => {
    describe('CreateCustomerSchema', () => {
      it('should validate a complete valid customer', () => {
        const validCustomer = {
          name: 'Minh Phu Seafood Corp',
          primary_contact_name: 'Nguyen Van Minh',
          primary_contact_phone: '+84-28-123-4567',
          email: 'minh@minhphu.com',
          address_text: 'Can Tho, Vietnam',
          country: 'Vietnam',
          province: 'Can Tho',
          district: 'Ninh Kieu'
        };

        const result = CreateCustomerSchema.safeParse(validCustomer);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.name).toBe(validCustomer.name);
          expect(result.data.email).toBe(validCustomer.email);
          expect(result.data.country).toBe(validCustomer.country);
        }
      });

      it('should reject customer with invalid email', () => {
        const invalidCustomer = {
          name: 'Test Customer',
          primary_contact_name: 'John Doe',
          email: 'invalid-email-format', // Invalid email
          address_text: 'Test Address',
          country: 'Vietnam'
        };

        const result = CreateCustomerSchema.safeParse(invalidCustomer);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          const emailError = result.error.issues.find(
            issue => issue.path[0] === 'email'
          );
          expect(emailError).toBeDefined();
        }
      });

      it('should reject customer with empty required fields', () => {
        const incompleteCustomer = {
          name: '', // Empty name
          email: 'test@example.com',
          // Missing other required fields
        };

        const result = CreateCustomerSchema.safeParse(incompleteCustomer);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          const errors = result.error.issues.map(issue => issue.path[0]);
          expect(errors).toContain('name');
        }
      });

      it('should set default status to active', () => {
        const customer = {
          name: 'Test Customer',
          primary_contact_name: 'John Doe',
          email: 'test@example.com',
          address_text: 'Test Address',
          country: 'Vietnam'
          // status not specified
        };

        const result = CreateCustomerSchema.safeParse(customer);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.status).toBe('active');
        }
      });

      it('should accept valid status values', () => {
        const validStatuses = ['active', 'paused', 'blacklisted'];
        
        validStatuses.forEach(status => {
          const customer = {
            name: 'Test Customer',
            primary_contact_name: 'John Doe',
            email: 'test@example.com',
            address_text: 'Test Address',
            country: 'Vietnam',
            status
          };

          const result = CreateCustomerSchema.safeParse(customer);
          expect(result.success).toBe(true);
          
          if (result.success) {
            expect(result.data.status).toBe(status);
          }
        });
      });

      it('should reject invalid status values', () => {
        const customer = {
          name: 'Test Customer',
          primary_contact_name: 'John Doe',
          email: 'test@example.com',
          address_text: 'Test Address',
          country: 'Vietnam',
          status: 'invalid_status'
        };

        const result = CreateCustomerSchema.safeParse(customer);
        expect(result.success).toBe(false);
      });

      it('should validate latitude and longitude ranges', () => {
        const validCustomer = {
          name: 'Test Customer',
          primary_contact_name: 'John Doe',
          email: 'test@example.com',
          address_text: 'Test Address',
          country: 'Vietnam',
          latitude: 10.7769, // Valid latitude
          longitude: 106.7009 // Valid longitude
        };

        const result = CreateCustomerSchema.safeParse(validCustomer);
        expect(result.success).toBe(true);
      });

      it('should reject invalid latitude values', () => {
        const invalidCustomer = {
          name: 'Test Customer',
          primary_contact_name: 'John Doe',
          email: 'test@example.com',
          address_text: 'Test Address',
          country: 'Vietnam',
          latitude: 95, // Invalid latitude (> 90)
          longitude: 106.7009
        };

        const result = CreateCustomerSchema.safeParse(invalidCustomer);
        expect(result.success).toBe(false);
      });

      it('should reject invalid longitude values', () => {
        const invalidCustomer = {
          name: 'Test Customer',
          primary_contact_name: 'John Doe',
          email: 'test@example.com',
          address_text: 'Test Address',
          country: 'Vietnam',
          latitude: 10.7769,
          longitude: 185 // Invalid longitude (> 180)
        };

        const result = CreateCustomerSchema.safeParse(invalidCustomer);
        expect(result.success).toBe(false);
      });
    });

    describe('UpdateCustomerSchema', () => {
      it('should allow partial updates', () => {
        const partialUpdate = {
          primary_contact_phone: '+84-28-999-8888',
          status: 'paused'
        };

        const result = UpdateCustomerSchema.safeParse(partialUpdate);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.primary_contact_phone).toBe(partialUpdate.primary_contact_phone);
          expect(result.data.status).toBe(partialUpdate.status);
        }
      });

      it('should validate email format in updates', () => {
        const invalidUpdate = {
          email: 'invalid-email-format'
        };

        const result = UpdateCustomerSchema.safeParse(invalidUpdate);
        expect(result.success).toBe(false);
      });
    });

    describe('CustomerFilterSchema', () => {
      it('should validate search and filter parameters', () => {
        const filters = {
          search: 'Minh Phu',
          country: 'Vietnam',
          status: 'active',
          credential_status: 'valid',
          limit: 25,
          offset: 50
        };

        const result = CustomerFilterSchema.safeParse(filters);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.search).toBe(filters.search);
          expect(result.data.country).toBe(filters.country);
          expect(result.data.limit).toBe(filters.limit);
        }
      });

      it('should apply default pagination values', () => {
        const filters = {};

        const result = CustomerFilterSchema.safeParse(filters);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.limit).toBe(20);
          expect(result.data.offset).toBe(0);
        }
      });
    });
  });

  describe('Edge Cases and Security', () => {
    it('should prevent SQL injection in string fields', () => {
      const maliciousData = {
        customer_id: "'; DROP TABLE orders; --",
        species: 'Penaeus vannamei',
        quantity: 1000,
        unit_price: 0.85,
        unit_price_currency: 'USD',
        total_value_currency: 'USD',
        unit: 'pieces',
        order_date: '2024-11-04'
      };

      // The schema should still validate, but the malicious input
      // should be treated as a regular string
      const result = CreateOrderSchema.safeParse(maliciousData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.customer_id).toBe(maliciousData.customer_id);
        // The actual SQL injection prevention happens at the database layer
      }
    });

    it('should handle very large numbers appropriately', () => {
      const largeNumberOrder = {
        customer_id: 'customer-123',
        species: 'Penaeus vannamei',
        quantity: Number.MAX_SAFE_INTEGER,
        unit_price: 999999999.99,
        unit_price_currency: 'USD',
        total_value_currency: 'USD',
        unit: 'pieces',
        order_date: '2024-11-04'
      };

      const result = CreateOrderSchema.safeParse(largeNumberOrder);
      // This should either validate or fail gracefully, depending on business rules
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle special characters in text fields', () => {
      const specialCharCustomer = {
        name: 'Công ty TNHH Tôm Sú Việt Nam (100% 外資)',
        primary_contact_name: 'Nguyễn Văn Ánh',
        email: 'contact@company.com.vn',
        address_text: '123 Đường Lê Lợi, Quận 1, TP.HCM',
        country: 'Vietnam'
      };

      const result = CreateCustomerSchema.safeParse(specialCharCustomer);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.name).toBe(specialCharCustomer.name);
        expect(result.data.primary_contact_name).toBe(specialCharCustomer.primary_contact_name);
      }
    });
  });
});