import { z } from 'zod';
import { GoogleSheetsService } from './googleSheetsService';
import {
  GoogleSheetsCustomerRowSchema,
  GoogleSheetsOrderRowSchema,
  GoogleSheetsBatchRowSchema,
  CreateSyncErrorInput,
} from '../models/sync';
import {
  CreateCustomerSchema,
  CustomerStatus,
  CredentialType,
} from '../models/customer';
import {
  CreateOrderSchema,
  ShipmentStatus,
  QualityFlag,
} from '../models/order';
import {
  CreateBroodstockBatchSchema,
} from '../models/broodstockBatch';

export interface ValidationResult {
  isValid: boolean;
  data?: any;
  errors: ValidationError[];
}

export interface ValidationError {
  rowNumber: number;
  sheetName: string;
  entityType: 'customer' | 'order' | 'broodstock_batch';
  errorType: string;
  errorMessage: string;
  fieldName?: string;
  invalidValue?: string;
  dataSnapshot: Record<string, any>;
}

/**
 * Validation Service
 * Handles comprehensive validation of Google Sheets data before database insertion
 */
export class ValidationService {
  /**
   * Validate customer rows from Google Sheets
   * @param rows - Parsed customer rows
   * @param sheetName - Name of the sheet (for error tracking)
   * @returns Validation result with valid data and errors
   */
  validateCustomerRows(
    rows: { rowNumber: number; data: Record<string, any> }[],
    sheetName: string = 'Customers'
  ): { validRows: any[]; errors: ValidationError[] } {
    const validRows: any[] = [];
    const errors: ValidationError[] = [];

    for (const row of rows) {
      try {
        // Step 1: Validate against Google Sheets schema
        const rawData = GoogleSheetsCustomerRowSchema.parse(row.data);

        // Step 2: Transform to database format
        const transformed = this.transformCustomerRow(rawData);

        // Step 3: Validate against database schema
        const validated = CreateCustomerSchema.parse(transformed);

        // Step 4: Additional business rule validation
        this.validateCustomerBusinessRules(validated, row.rowNumber, row.data);

        validRows.push({
          rowNumber: row.rowNumber,
          data: validated,
        });
      } catch (error: any) {
        const validationError = this.createValidationError(
          row.rowNumber,
          sheetName,
          'customer',
          error,
          row.data
        );
        errors.push(validationError);
      }
    }

    return { validRows, errors };
  }

  /**
   * Validate order rows from Google Sheets
   * @param rows - Parsed order rows
   * @param sheetName - Name of the sheet
   * @returns Validation result with valid data and errors
   */
  validateOrderRows(
    rows: { rowNumber: number; data: Record<string, any> }[],
    sheetName: string = 'Orders'
  ): { validRows: any[]; errors: ValidationError[] } {
    const validRows: any[] = [];
    const errors: ValidationError[] = [];

    for (const row of rows) {
      try {
        // Step 1: Validate against Google Sheets schema
        const rawData = GoogleSheetsOrderRowSchema.parse(row.data);

        // Step 2: Transform to database format
        const transformed = this.transformOrderRow(rawData);

        // Step 3: Validate against database schema (partial - customer_id will be added later)
        const partialSchema = CreateOrderSchema.omit({ customer_id: true, broodstock_batch_id: true });
        const validated = partialSchema.parse(transformed);

        // Step 4: Additional business rule validation
        this.validateOrderBusinessRules(validated, row.rowNumber, row.data);

        validRows.push({
          rowNumber: row.rowNumber,
          data: {
            ...validated,
            customer_email: rawData.customer_email, // Keep for lookup
            broodstock_batch_code: rawData.broodstock_batch_code || null, // Keep for lookup
          },
        });
      } catch (error: any) {
        const validationError = this.createValidationError(
          row.rowNumber,
          sheetName,
          'order',
          error,
          row.data
        );
        errors.push(validationError);
      }
    }

    return { validRows, errors };
  }

  /**
   * Validate batch rows from Google Sheets
   * @param rows - Parsed batch rows
   * @param sheetName - Name of the sheet
   * @returns Validation result with valid data and errors
   */
  validateBatchRows(
    rows: { rowNumber: number; data: Record<string, any> }[],
    sheetName: string = 'Batches'
  ): { validRows: any[]; errors: ValidationError[] } {
    const validRows: any[] = [];
    const errors: ValidationError[] = [];

    for (const row of rows) {
      try {
        // Step 1: Validate against Google Sheets schema
        const rawData = GoogleSheetsBatchRowSchema.parse(row.data);

        // Step 2: Transform to database format
        const transformed = this.transformBatchRow(rawData);

        // Step 3: Validate against database schema
        const validated = CreateBroodstockBatchSchema.parse(transformed);

        // Step 4: Additional business rule validation
        this.validateBatchBusinessRules(validated, row.rowNumber, row.data);

        validRows.push({
          rowNumber: row.rowNumber,
          data: validated,
        });
      } catch (error: any) {
        const validationError = this.createValidationError(
          row.rowNumber,
          sheetName,
          'broodstock_batch',
          error,
          row.data
        );
        errors.push(validationError);
      }
    }

    return { validRows, errors };
  }

  /**
   * Transform customer row from Google Sheets format to database format
   */
  private transformCustomerRow(raw: any): any {
    const transformed: any = {
      name: raw.name,
      primary_contact_name: raw.primary_contact_name,
      email: raw.email || undefined,
      primary_contact_phone: raw.phone || undefined,
      address_text: raw.address || undefined,
      country: raw.country || undefined,
      province: raw.province || undefined,
      district: raw.district || undefined,
      status: raw.status || 'active',
    };

    // Handle latitude/longitude
    if (raw.latitude && raw.longitude) {
      try {
        transformed.latitude = GoogleSheetsService.normalizeNumber(raw.latitude, 'latitude');
        transformed.longitude = GoogleSheetsService.normalizeNumber(raw.longitude, 'longitude');
      } catch (error) {
        // Will be caught by validation
      }
    }

    // Handle credentials (up to 3 credentials from sheets)
    const credentials: any[] = [];

    for (let i = 1; i <= 3; i++) {
      const type = raw[`credential_type_${i}`];
      const number = raw[`credential_number_${i}`];
      const issued = raw[`credential_issued_${i}`];
      const expiry = raw[`credential_expiry_${i}`];
      const fileUrl = raw[`credential_file_url_${i}`];

      if (type && number && issued && expiry && fileUrl) {
        try {
          credentials.push({
            type: type,
            number: number,
            issued_date: GoogleSheetsService.normalizeDate(issued),
            expiry_date: GoogleSheetsService.normalizeDate(expiry),
            file_url: fileUrl,
          });
        } catch (error) {
          // Skip invalid credential
        }
      }
    }

    if (credentials.length > 0) {
      transformed.credentials = credentials;
    }

    return transformed;
  }

  /**
   * Transform order row from Google Sheets format to database format
   */
  private transformOrderRow(raw: any): any {
    const transformed: any = {
      order_date: GoogleSheetsService.normalizeDate(raw.order_date),
      species: raw.species,
      strain: raw.strain || undefined,
      quantity: GoogleSheetsService.normalizeInteger(raw.quantity, 'quantity'),
      unit_price: GoogleSheetsService.normalizeNumber(raw.unit_price, 'unit_price'),
      unit: raw.unit || 'piece',
      unit_price_currency: raw.unit_price_currency || 'USD',
      total_value_currency: raw.total_value_currency || 'USD',
      packaging_type: raw.packaging_type || undefined,
      shipment_status: raw.shipment_status || 'pending',
      quality_flag: raw.quality_flag || 'ok',
      mortality_reported: raw.mortality_reported
        ? GoogleSheetsService.normalizeInteger(raw.mortality_reported, 'mortality_reported')
        : 0,
      notes: raw.notes || undefined,
    };

    // Handle optional shipment_date
    if (raw.shipment_date && raw.shipment_date !== '') {
      try {
        transformed.shipment_date = GoogleSheetsService.normalizeDate(raw.shipment_date);
      } catch (error) {
        // Skip if invalid
      }
    }

    return transformed;
  }

  /**
   * Transform batch row from Google Sheets format to database format
   */
  private transformBatchRow(raw: any): any {
    const transformed: any = {
      batch_code: raw.batch_code,
      hatchery_origin: raw.hatchery_origin,
      arrival_date: GoogleSheetsService.normalizeDate(raw.arrival_date),
      available_quantity: GoogleSheetsService.normalizeInteger(raw.available_quantity, 'available_quantity'),
      grade: raw.grade || undefined,
      species: raw.species || undefined,
      strain: raw.strain || undefined,
      health_status: raw.health_status || 'good',
      quarantine_status: raw.quarantine_status || 'pending',
      notes: raw.notes || undefined,
    };

    // Handle optional fields
    if (raw.initial_quantity && raw.initial_quantity !== '') {
      transformed.initial_quantity = GoogleSheetsService.normalizeInteger(raw.initial_quantity, 'initial_quantity');
    }

    if (raw.age_weeks && raw.age_weeks !== '') {
      transformed.age_weeks = GoogleSheetsService.normalizeNumber(raw.age_weeks, 'age_weeks');
    }

    if (raw.weight_grams && raw.weight_grams !== '') {
      transformed.weight_grams = GoogleSheetsService.normalizeNumber(raw.weight_grams, 'weight_grams');
    }

    return transformed;
  }

  /**
   * Validate customer business rules
   */
  private validateCustomerBusinessRules(data: any, rowNumber: number, rawData: Record<string, any>): void {
    // Latitude/longitude must both be present or both absent
    if ((data.latitude && !data.longitude) || (!data.latitude && data.longitude)) {
      throw new Error('Both latitude and longitude must be provided together');
    }

    // Latitude range: -90 to 90
    if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
      throw new Error('Latitude must be between -90 and 90');
    }

    // Longitude range: -180 to 180
    if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
      throw new Error('Longitude must be between -180 and 180');
    }

    // At least email or phone must be provided
    if (!data.email && !data.primary_contact_phone) {
      throw new Error('Either email or phone number must be provided');
    }
  }

  /**
   * Validate order business rules
   */
  private validateOrderBusinessRules(data: any, rowNumber: number, rawData: Record<string, any>): void {
    // Quantity must be positive
    if (data.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Unit price must be positive
    if (data.unit_price <= 0) {
      throw new Error('Unit price must be greater than 0');
    }

    // Mortality cannot exceed quantity
    if (data.mortality_reported > data.quantity) {
      throw new Error('Mortality reported cannot exceed quantity ordered');
    }

    // Order date cannot be in the future
    const orderDate = new Date(data.order_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (orderDate > today) {
      throw new Error('Order date cannot be in the future');
    }

    // If shipment_date is provided, it must be >= order_date
    if (data.shipment_date) {
      const shipmentDate = new Date(data.shipment_date);
      if (shipmentDate < orderDate) {
        throw new Error('Shipment date cannot be before order date');
      }
    }
  }

  /**
   * Validate batch business rules
   */
  private validateBatchBusinessRules(data: any, rowNumber: number, rawData: Record<string, any>): void {
    // Available quantity must be >= 0
    if (data.available_quantity < 0) {
      throw new Error('Available quantity cannot be negative');
    }

    // If initial_quantity is provided, available_quantity <= initial_quantity
    if (data.initial_quantity !== undefined && data.available_quantity > data.initial_quantity) {
      throw new Error('Available quantity cannot exceed initial quantity');
    }

    // Age and weight must be positive if provided
    if (data.age_weeks !== undefined && data.age_weeks < 0) {
      throw new Error('Age in weeks cannot be negative');
    }

    if (data.weight_grams !== undefined && data.weight_grams <= 0) {
      throw new Error('Weight in grams must be positive');
    }

    // Arrival date should not be in the future
    const arrivalDate = new Date(data.arrival_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (arrivalDate > today) {
      throw new Error('Arrival date cannot be in the future');
    }
  }

  /**
   * Create a standardized validation error object
   */
  private createValidationError(
    rowNumber: number,
    sheetName: string,
    entityType: 'customer' | 'order' | 'broodstock_batch',
    error: any,
    dataSnapshot: Record<string, any>
  ): ValidationError {
    let errorMessage = error.message || 'Unknown validation error';
    let fieldName: string | undefined;
    let invalidValue: string | undefined;
    let errorType = 'validation_error';

    // Parse Zod errors for better error messages
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      fieldName = firstError?.path?.join('.') || '';
      invalidValue = fieldName ? String(dataSnapshot[fieldName] || '') : '';
      errorMessage = `${fieldName}: ${firstError.message}`;
      errorType = 'type_error';
    } else if (error.message.includes('must be')) {
      errorType = 'business_rule_violation';
      // Try to extract field name from error message
      const match = error.message.match(/^(\w+):/);
      if (match) {
        fieldName = match[1];
      }
    }

    return {
      rowNumber,
      sheetName,
      entityType,
      errorType,
      errorMessage,
      fieldName,
      invalidValue,
      dataSnapshot,
    };
  }
}

// Singleton instance
export const validationService = new ValidationService();
