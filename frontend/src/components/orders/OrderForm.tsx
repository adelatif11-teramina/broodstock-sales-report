'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Package, DollarSign, MapPin, FileText, Search } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';

// Order form schema
const OrderFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  species: z.string().min(1, 'Species is required'),
  strain: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit: z.enum(['pieces', 'kg', 'grams', 'tanks']),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  currency: z.enum(['USD', 'THB', 'EUR']).default('USD'),
  deliveryAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State/Province is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof OrderFormSchema>;

interface OrderFormProps {
  onSuccess: (orderId: string) => void;
  onCancel: () => void;
  initialData?: Partial<OrderFormData>;
}

const SPECIES_OPTIONS = [
  'White Shrimp (P. vannamei)',
  'Black Tiger Shrimp (P. monodon)',
  'Giant Freshwater Prawn (M. rosenbergii)',
  'Pacific White Shrimp',
  'Blue Shrimp',
];

const UNITS = [
  { value: 'pieces', label: 'Pieces' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'grams', label: 'Grams' },
  { value: 'tanks', label: 'Tanks' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'THB', label: 'THB (฿)' },
  { value: 'EUR', label: 'EUR (€)' },
];

export default function OrderForm({ onSuccess, onCancel, initialData }: OrderFormProps) {
  const queryClient = useQueryClient();
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(OrderFormSchema) as any,
    defaultValues: {
      currency: 'USD',
      unit: 'pieces',
      ...initialData,
    },
  });

  // Watch values for calculations
  const quantity = watch('quantity');
  const unitPrice = watch('unitPrice');
  const currency = watch('currency');

  // Calculate total
  const totalAmount = React.useMemo(() => {
    if (quantity && unitPrice) {
      return quantity * unitPrice;
    }
    return 0;
  }, [quantity, unitPrice]);

  // Search customers
  const { data: customersData } = useQuery({
    queryKey: [...queryKeys.customers, { search: customerSearch }],
    queryFn: () => apiClient.getCustomers({ search: customerSearch, limit: 10 }),
    enabled: customerSearch.length > 2,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data: OrderFormData) => apiClient.createOrder(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      onSuccess(data.id);
    },
  });

  const onSubmit = (data: OrderFormData) => {
    createOrderMutation.mutate(data);
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setValue('customerId', customer.id);
    
    // Pre-fill delivery address with customer's primary address
    if (customer.address) {
      setValue('deliveryAddress.street', customer.address.street || '');
      setValue('deliveryAddress.city', customer.address.city || '');
      setValue('deliveryAddress.state', customer.address.state || '');
      setValue('deliveryAddress.country', customer.address.country || '');
      setValue('deliveryAddress.postalCode', customer.address.postalCode || '');
    }
    
    setCustomerSearch('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Customer Selection */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
          </div>
          
          {selectedCustomer ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedCustomer.name}</h4>
                  <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                  <p className="text-sm text-gray-600">
                    {selectedCustomer.address?.city}, {selectedCustomer.address?.country}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setValue('customerId', '');
                  }}
                >
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Customer
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search by name, email, or company..."
                  className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {customersData?.items && customerSearch.length > 2 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {customersData.items.map((customer: any) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-600">{customer.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {errors.customerId && (
            <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
          )}
        </div>

        {/* Product Information */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center mb-4">
            <Package className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Species *
              </label>
              <select
                {...register('species')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select species</option>
                {SPECIES_OPTIONS.map((species) => (
                  <option key={species} value={species}>
                    {species}
                  </option>
                ))}
              </select>
              {errors.species && (
                <p className="mt-1 text-sm text-red-600">{errors.species.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strain (Optional)
              </label>
              <input
                type="text"
                {...register('strain')}
                placeholder="e.g., SPF, SPR"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                min="1"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                {...register('unit')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center mb-4">
            <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('unitPrice', { valueAsNumber: true })}
                min="0"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.unitPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.unitPrice.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                {...register('currency')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.value} value={curr.value}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(totalAmount, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center mb-4">
            <MapPin className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Delivery Address</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                {...register('deliveryAddress.street')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.deliveryAddress?.street && (
                <p className="mt-1 text-sm text-red-600">{errors.deliveryAddress.street.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  {...register('deliveryAddress.city')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.deliveryAddress?.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.deliveryAddress.city.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province *
                </label>
                <input
                  type="text"
                  {...register('deliveryAddress.state')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.deliveryAddress?.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.deliveryAddress.state.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  {...register('deliveryAddress.country')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.deliveryAddress?.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.deliveryAddress.country.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  {...register('deliveryAddress.postalCode')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.deliveryAddress?.postalCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.deliveryAddress.postalCode.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Additional Notes</h3>
          </div>
          
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Any special instructions or notes for this order..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createOrderMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createOrderMutation.isPending}
            disabled={!selectedCustomer || createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? 'Creating Order...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}