import { pool } from '../config/database';

export interface OrderCalculations {
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  shipping_cost: number;
  total_amount: number;
  currency: string;
}

export interface PricingRule {
  id: string;
  name: string;
  species?: string;
  min_quantity?: number;
  max_quantity?: number;
  discount_percentage?: number;
  fixed_discount?: number;
  customer_tier?: string;
  valid_from: Date;
  valid_to?: Date;
  is_active: boolean;
}

export interface ShippingRate {
  country: string;
  base_rate: number;
  per_kg_rate: number;
  min_charge: number;
  currency: string;
}

export interface TaxRate {
  country: string;
  rate_percentage: number;
  tax_type: string; // 'VAT', 'GST', 'Sales Tax', etc.
}

export class BusinessLogicService {
  /**
   * Calculate order totals including taxes, discounts, and shipping
   */
  async calculateOrderTotals(
    quantity: number,
    unitPrice: number,
    currency: string,
    customerId: string,
    species: string,
    country?: string,
    estimatedWeightKg?: number
  ): Promise<OrderCalculations> {
    const subtotal = quantity * unitPrice;
    
    // Calculate discount
    const discountAmount = await this.calculateDiscount(
      subtotal,
      quantity,
      species,
      customerId
    );

    // Calculate shipping
    const shippingCost = await this.calculateShipping(
      country || 'TH',
      estimatedWeightKg || quantity * 0.025, // Default 25g per piece
      currency
    );

    // Calculate tax on subtotal minus discount plus shipping
    const taxableAmount = subtotal - discountAmount + shippingCost;
    const taxAmount = await this.calculateTax(taxableAmount, country || 'TH');

    const totalAmount = subtotal - discountAmount + shippingCost + taxAmount;

    return {
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      shipping_cost: shippingCost,
      total_amount: totalAmount,
      currency,
    };
  }

  /**
   * Calculate applicable discounts for an order
   */
  async calculateDiscount(
    subtotal: number,
    quantity: number,
    species: string,
    customerId: string
  ): Promise<number> {
    try {
      // Get customer tier
      const customerTier = await this.getCustomerTier(customerId);
      
      // Find applicable pricing rules
      const rules = await this.getApplicablePricingRules(
        species,
        quantity,
        customerTier
      );

      let maxDiscount = 0;

      for (const rule of rules) {
        let discount = 0;

        if (rule.discount_percentage) {
          discount = subtotal * (rule.discount_percentage / 100);
        } else if (rule.fixed_discount) {
          discount = rule.fixed_discount;
        }

        maxDiscount = Math.max(maxDiscount, discount);
      }

      return Math.min(maxDiscount, subtotal); // Don't discount more than subtotal
    } catch (error) {
      console.error('Error calculating discount:', error);
      return 0;
    }
  }

  /**
   * Calculate shipping cost based on destination and weight
   */
  async calculateShipping(
    country: string,
    weightKg: number,
    currency: string
  ): Promise<number> {
    try {
      const shippingRate = await this.getShippingRate(country);
      
      if (!shippingRate) {
        // Default shipping for unknown countries
        return currency === 'USD' ? 50 : 1500; // $50 USD or 1500 THB
      }

      const cost = shippingRate.base_rate + (weightKg * shippingRate.per_kg_rate);
      const finalCost = Math.max(cost, shippingRate.min_charge);

      // Convert currency if needed
      return await this.convertCurrency(finalCost, shippingRate.currency, currency);
    } catch (error) {
      console.error('Error calculating shipping:', error);
      return 0;
    }
  }

  /**
   * Calculate tax based on country and amount
   */
  async calculateTax(amount: number, country: string): Promise<number> {
    try {
      const taxRate = await this.getTaxRate(country);
      
      if (!taxRate) {
        return 0; // No tax for unknown countries
      }

      return amount * (taxRate.rate_percentage / 100);
    } catch (error) {
      console.error('Error calculating tax:', error);
      return 0;
    }
  }

  /**
   * Get customer tier based on purchase history
   */
  async getCustomerTier(customerId: string): Promise<string> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(total_value) as total_spent,
          MAX(order_date) as last_order_date
        FROM orders 
        WHERE customer_id = $1 
        AND order_date >= CURRENT_DATE - INTERVAL '12 months'
      `;

      const result = await pool.query(query, [customerId]);
      const stats = result.rows[0];

      const totalOrders = parseInt(stats.total_orders);
      const totalSpent = parseFloat(stats.total_spent || 0);

      // Define tier logic
      if (totalSpent >= 100000 || totalOrders >= 50) {
        return 'platinum';
      } else if (totalSpent >= 50000 || totalOrders >= 25) {
        return 'gold';
      } else if (totalSpent >= 20000 || totalOrders >= 10) {
        return 'silver';
      } else {
        return 'bronze';
      }
    } catch (error) {
      console.error('Error getting customer tier:', error);
      return 'bronze';
    }
  }

  /**
   * Get applicable pricing rules
   */
  async getApplicablePricingRules(
    species: string,
    quantity: number,
    customerTier: string
  ): Promise<PricingRule[]> {
    // In a real implementation, this would query a pricing_rules table
    // For now, return hardcoded business rules
    const rules: PricingRule[] = [];

    // Volume discounts
    if (quantity >= 100) {
      rules.push({
        id: 'volume_100',
        name: 'Volume Discount 100+',
        min_quantity: 100,
        discount_percentage: 5,
        valid_from: new Date('2024-01-01'),
        is_active: true,
      });
    }

    if (quantity >= 500) {
      rules.push({
        id: 'volume_500',
        name: 'Volume Discount 500+',
        min_quantity: 500,
        discount_percentage: 10,
        valid_from: new Date('2024-01-01'),
        is_active: true,
      });
    }

    if (quantity >= 1000) {
      rules.push({
        id: 'volume_1000',
        name: 'Volume Discount 1000+',
        min_quantity: 1000,
        discount_percentage: 15,
        valid_from: new Date('2024-01-01'),
        is_active: true,
      });
    }

    // Customer tier discounts
    switch (customerTier) {
      case 'platinum':
        rules.push({
          id: 'tier_platinum',
          name: 'Platinum Customer Discount',
          customer_tier: 'platinum',
          discount_percentage: 8,
          valid_from: new Date('2024-01-01'),
          is_active: true,
        });
        break;
      case 'gold':
        rules.push({
          id: 'tier_gold',
          name: 'Gold Customer Discount',
          customer_tier: 'gold',
          discount_percentage: 5,
          valid_from: new Date('2024-01-01'),
          is_active: true,
        });
        break;
      case 'silver':
        rules.push({
          id: 'tier_silver',
          name: 'Silver Customer Discount',
          customer_tier: 'silver',
          discount_percentage: 3,
          valid_from: new Date('2024-01-01'),
          is_active: true,
        });
        break;
    }

    // Species-specific discounts
    if (species.toLowerCase().includes('monodon')) {
      rules.push({
        id: 'species_monodon',
        name: 'Premium Species Discount',
        species: 'monodon',
        discount_percentage: 2,
        valid_from: new Date('2024-01-01'),
        is_active: true,
      });
    }

    return rules;
  }

  /**
   * Get shipping rate for a country
   */
  async getShippingRate(country: string): Promise<ShippingRate | null> {
    // In a real implementation, this would query a shipping_rates table
    const shippingRates: { [key: string]: ShippingRate } = {
      'TH': { // Thailand (domestic)
        country: 'TH',
        base_rate: 200,
        per_kg_rate: 50,
        min_charge: 300,
        currency: 'THB',
      },
      'PH': { // Philippines
        country: 'PH',
        base_rate: 800,
        per_kg_rate: 200,
        min_charge: 1200,
        currency: 'THB',
      },
      'VN': { // Vietnam
        country: 'VN',
        base_rate: 600,
        per_kg_rate: 150,
        min_charge: 900,
        currency: 'THB',
      },
      'ID': { // Indonesia
        country: 'ID',
        base_rate: 1000,
        per_kg_rate: 250,
        min_charge: 1500,
        currency: 'THB',
      },
      'MY': { // Malaysia
        country: 'MY',
        base_rate: 500,
        per_kg_rate: 120,
        min_charge: 700,
        currency: 'THB',
      },
      'SG': { // Singapore
        country: 'SG',
        base_rate: 400,
        per_kg_rate: 100,
        min_charge: 600,
        currency: 'THB',
      },
    };

    return shippingRates[country] || null;
  }

  /**
   * Get tax rate for a country
   */
  async getTaxRate(country: string): Promise<TaxRate | null> {
    // In a real implementation, this would query a tax_rates table
    const taxRates: { [key: string]: TaxRate } = {
      'TH': { // Thailand VAT
        country: 'TH',
        rate_percentage: 7,
        tax_type: 'VAT',
      },
      'PH': { // Philippines VAT
        country: 'PH',
        rate_percentage: 12,
        tax_type: 'VAT',
      },
      'VN': { // Vietnam VAT
        country: 'VN',
        rate_percentage: 10,
        tax_type: 'VAT',
      },
      'ID': { // Indonesia VAT
        country: 'ID',
        rate_percentage: 11,
        tax_type: 'VAT',
      },
      'MY': { // Malaysia GST (currently 0%)
        country: 'MY',
        rate_percentage: 0,
        tax_type: 'GST',
      },
      'SG': { // Singapore GST
        country: 'SG',
        rate_percentage: 8,
        tax_type: 'GST',
      },
    };

    return taxRates[country] || null;
  }

  /**
   * Convert currency (simplified - in production use a real exchange rate API)
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Simplified exchange rates (in production, use a real API)
    const exchangeRates: { [key: string]: { [key: string]: number } } = {
      'THB': {
        'USD': 0.028,
        'EUR': 0.026,
        'PHP': 1.55,
        'VND': 678,
        'IDR': 424,
        'MYR': 0.13,
        'SGD': 0.038,
      },
      'USD': {
        'THB': 35.7,
        'EUR': 0.92,
        'PHP': 55.5,
        'VND': 24200,
        'IDR': 15150,
        'MYR': 4.65,
        'SGD': 1.35,
      },
    };

    const rate = exchangeRates[fromCurrency]?.[toCurrency];
    
    if (!rate) {
      console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      return amount; // Return original amount if no rate found
    }

    return amount * rate;
  }

  /**
   * Validate business rules for an order
   */
  async validateOrderRules(
    customerId: string,
    species: string,
    quantity: number,
    totalValue: number
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check customer status
      const customerQuery = 'SELECT status FROM customers WHERE id = $1';
      const customerResult = await pool.query(customerQuery, [customerId]);
      
      if (customerResult.rows.length === 0) {
        errors.push('Customer not found');
      } else if (customerResult.rows[0].status === 'blacklisted') {
        errors.push('Cannot create orders for blacklisted customers');
      }

      // Check minimum order value
      const minOrderValue = 500; // $500 or equivalent
      if (totalValue < minOrderValue) {
        errors.push(`Order value must be at least ${minOrderValue}`);
      }

      // Check maximum order quantity per species
      const maxQuantityPerOrder = 5000;
      if (quantity > maxQuantityPerOrder) {
        errors.push(`Maximum quantity per order is ${maxQuantityPerOrder}`);
      }

      // Check customer credit limit (if applicable)
      const pendingOrdersQuery = `
        SELECT SUM(total_value) as pending_value 
        FROM orders 
        WHERE customer_id = $1 
        AND shipment_status IN ('pending', 'shipped')
      `;
      
      const pendingResult = await pool.query(pendingOrdersQuery, [customerId]);
      const pendingValue = parseFloat(pendingResult.rows[0].pending_value || 0);
      const creditLimit = 100000; // $100k default credit limit
      
      if (pendingValue + totalValue > creditLimit) {
        errors.push('Order would exceed customer credit limit');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.error('Error validating order rules:', error);
      return {
        isValid: false,
        errors: ['Error validating order rules'],
      };
    }
  }

  /**
   * Calculate recommended pricing based on market conditions
   */
  async getRecommendedPricing(
    species: string,
    quantity: number,
    customerId?: string
  ): Promise<{
    suggested_unit_price: number;
    market_average: number;
    confidence_level: number;
    factors: string[];
  }> {
    try {
      // Get recent pricing data for similar orders
      const pricingQuery = `
        SELECT 
          AVG(unit_price) as avg_price,
          MIN(unit_price) as min_price,
          MAX(unit_price) as max_price,
          COUNT(*) as sample_size
        FROM orders
        WHERE species ILIKE $1
        AND order_date >= CURRENT_DATE - INTERVAL '60 days'
        AND quantity BETWEEN $2 * 0.5 AND $2 * 2
      `;

      const result = await pool.query(pricingQuery, [species, quantity]);
      const pricingData = result.rows[0];

      const marketAverage = parseFloat(pricingData.avg_price || 25);
      const sampleSize = parseInt(pricingData.sample_size || 0);
      
      // Calculate confidence based on sample size
      const confidenceLevel = Math.min(sampleSize / 10, 1); // Max confidence at 10+ samples

      const factors: string[] = [];
      let suggestedPrice = marketAverage;

      // Adjust for quantity (volume discount)
      if (quantity >= 1000) {
        suggestedPrice *= 0.95;
        factors.push('Large volume discount applied');
      } else if (quantity >= 500) {
        suggestedPrice *= 0.97;
        factors.push('Volume discount applied');
      }

      // Adjust for customer tier if provided
      if (customerId) {
        const customerTier = await this.getCustomerTier(customerId);
        if (customerTier === 'platinum') {
          suggestedPrice *= 0.95;
          factors.push('Platinum customer pricing');
        } else if (customerTier === 'gold') {
          suggestedPrice *= 0.97;
          factors.push('Gold customer pricing');
        }
      }

      // Market conditions (simplified)
      if (sampleSize < 5) {
        factors.push('Limited market data available');
      }

      return {
        suggested_unit_price: Math.round(suggestedPrice * 100) / 100,
        market_average: Math.round(marketAverage * 100) / 100,
        confidence_level: Math.round(confidenceLevel * 100) / 100,
        factors,
      };
    } catch (error) {
      console.error('Error calculating recommended pricing:', error);
      return {
        suggested_unit_price: 25,
        market_average: 25,
        confidence_level: 0.1,
        factors: ['Error calculating pricing - using default'],
      };
    }
  }
}

export const businessLogicService = new BusinessLogicService();