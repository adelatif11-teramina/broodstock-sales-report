require('ts-node/register');

const { customerService } = require('../src/services/customerService');

jest.mock('../src/config/database', () => {
  const connectMock = jest.fn();
  return {
    __esModule: true,
    pool: {
      connect: connectMock,
    },
  };
});

const { pool } = require('../src/config/database');

describe('customerService.getAnalytics', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-03-10T00:00:00.000Z'));
    // @ts-ignore assigning jest helpers at runtime
    pool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockReset();
    mockClient.release.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns aggregated analytics with warnings and timeline entries', async () => {
    const customerId = 'cust-001';

    jest.spyOn(customerService, 'getById').mockResolvedValue({
      id: customerId,
      name: 'Test Customer',
      primary_contact_name: 'Jane Doe',
      primary_contact_phone: '+1-555-1234',
      email: 'jane@example.com',
      address_text: '123 Ocean Ave',
      latitude: 10.1,
      longitude: 105.7,
      country: 'Vietnam',
      province: 'Can Tho',
      district: 'Ninh Kieu',
      status: 'active',
      credentials: [
        {
          type: 'license',
          number: 'LIC-001',
          issued_date: '2024-01-01',
          expiry_date: '2024-12-31',
        },
        {
          type: 'permit',
          number: 'PER-002',
          issued_date: '2023-01-15',
          expiry_date: '2024-01-15',
        },
      ],
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2024-02-20'),
    });

    mockClient.query
      .mockResolvedValueOnce({
        rows: [
          {
            total_orders: 3,
            total_value: '12000.50',
            average_order_value: '4000.17',
            last_order_date: '2024-02-20',
            first_order_date: '2023-11-01',
            open_shipments: 1,
            open_issues: 1,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { period: '2024-Q1', order_count: 2, total_value: '8000.34', average_value: '4000.17' },
          { period: '2023-Q4', order_count: 1, total_value: '3999.99', average_value: '3999.99' },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { species: 'Penaeus vannamei', order_count: 2, total_quantity: '6000', total_value: '9000.34' },
          { species: 'Penaeus monodon', order_count: 1, total_quantity: '1500', total_value: '3000.16' },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'order-1',
            order_number: 'PO-001',
            order_date: '2024-02-20',
            shipment_status: 'pending',
            quality_flag: 'ok',
            total_value: '4000.17',
            quantity: 2000,
            species: 'Penaeus vannamei',
            strain: 'Line A',
            shipment_date: '2024-02-25',
            shipped_date: null,
            created_at: '2024-02-20T08:00:00Z',
            updated_at: '2024-02-20T08:00:00Z',
          },
          {
            id: 'order-2',
            order_number: 'PO-002',
            order_date: '2024-01-18',
            shipment_status: 'problem',
            quality_flag: 'critical_issue',
            total_value: '3999.99',
            quantity: 1800,
            species: 'Penaeus vannamei',
            strain: 'Line B',
            shipment_date: '2024-01-25',
            shipped_date: '2024-01-30',
            created_at: '2024-01-18T08:00:00Z',
            updated_at: '2024-01-30T08:00:00Z',
          },
          {
            id: 'order-3',
            order_number: 'PO-003',
            order_date: '2023-12-10',
            shipment_status: 'delivered',
            quality_flag: 'ok',
            total_value: '4000.34',
            quantity: 1700,
            species: 'Penaeus monodon',
            strain: null,
            shipment_date: '2023-12-18',
            shipped_date: '2023-12-20',
            created_at: '2023-12-10T08:00:00Z',
            updated_at: '2023-12-20T08:00:00Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { outstanding_count: 1, outstanding_value: '2500.00' },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-1',
            amount: '2500.00',
            currency: 'USD',
            status: 'pending',
            issued_date: '2024-02-22',
            paid_date: null,
            created_at: '2024-02-22T09:00:00Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'audit-1',
            action: 'update',
            user_id: 'user-1',
            changes: { field: 'status', previous: 'paused', current: 'active' },
            timestamp: '2024-02-15T10:00:00Z',
          },
        ],
      });

    const analytics = await customerService.getAnalytics(customerId);

    expect(mockClient.release).toHaveBeenCalled();
    expect(analytics.summary.totalOrders).toBe(3);
    expect(analytics.summary.totalValue).toBeCloseTo(12000.5);
    expect(analytics.summary.outstandingInvoiceCount).toBe(1);
    expect(analytics.credentialStatus.expired).toBe(1);
    expect(analytics.topSpecies).toHaveLength(2);
    expect(analytics.recentOrders[0].orderNumber).toBe('PO-001');
    expect(analytics.recentInvoices[0].id).toBe('inv-1');
    expect(analytics.timeline.length).toBeGreaterThan(0);

    const warningCodes = analytics.warnings.map((warning) => warning.code);
    expect(warningCodes).toEqual(expect.arrayContaining([
      'credentials_expired',
      'outstanding_invoices',
      'shipment_issues',
      'retention_watch',
    ]));
  });
});
