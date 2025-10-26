import { pool } from '../config/database';

/**
 * Generate a unique order number
 * Format: ORD-YYYY-NNNNNN (e.g., ORD-2024-000001)
 */
export const generateOrderNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;

  // Get the next sequence number for this year
  const query = `
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(order_number FROM LENGTH($1) + 1) AS INTEGER)
    ), 0) + 1 as next_number
    FROM orders
    WHERE order_number LIKE $2
  `;

  const result = await pool.query(query, [prefix, `${prefix}%`]);
  const nextNumber = result.rows[0].next_number;

  // Pad with zeros to make it 6 digits
  const paddedNumber = nextNumber.toString().padStart(6, '0');
  
  return `${prefix}${paddedNumber}`;
};

/**
 * Validate order number format
 */
export const validateOrderNumber = (orderNumber: string): boolean => {
  const regex = /^ORD-\d{4}-\d{6}$/;
  return regex.test(orderNumber);
};

/**
 * Extract year from order number
 */
export const extractYearFromOrderNumber = (orderNumber: string): number | null => {
  const match = orderNumber.match(/^ORD-(\d{4})-\d{6}$/);
  return match ? parseInt(match[1]) : null;
};