import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import {
  GoogleSheetsCustomerRow,
  GoogleSheetsOrderRow,
  GoogleSheetsBatchRow,
} from '../models/sync';

/**
 * Google Sheets Service
 * Handles authentication and data retrieval from Google Sheets
 */
export class GoogleSheetsService {
  private auth: JWT | null = null;
  private sheets: any = null;

  /**
   * Initialize Google Sheets API client with service account authentication
   * @param credentialsPath - Path to service account JSON file
   */
  async initialize(credentialsPath: string): Promise<void> {
    try {
      // Check if credentials file exists
      if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Google Sheets credentials file not found at: ${credentialsPath}`);
      }

      // Read service account credentials
      const credentialsContent = fs.readFileSync(credentialsPath, 'utf-8');
      const credentials = JSON.parse(credentialsContent);

      // Create JWT client
      this.auth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets.readonly',
        ],
      });

      // Authorize the client
      await this.auth.authorize();

      // Initialize Sheets API
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });

      console.log('Google Sheets API initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize Google Sheets API:', error.message);
      throw new Error(`Google Sheets initialization failed: ${error.message}`);
    }
  }

  /**
   * Check if the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.sheets || !this.auth) {
      throw new Error('Google Sheets service not initialized. Call initialize() first.');
    }
  }

  /**
   * Read data from a specific range in a Google Sheet
   * @param sheetId - The Google Sheet ID
   * @param range - The A1 notation range (e.g., 'Customers!A:Z')
   * @returns Array of row data
   */
  async readRange(sheetId: string, range: string): Promise<any[][]> {
    this.ensureInitialized();

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range,
        valueRenderOption: 'UNFORMATTED_VALUE', // Get raw values (numbers as numbers, not strings)
        dateTimeRenderOption: 'SERIAL_NUMBER', // Get dates as serial numbers
      });

      const rows = response.data.values || [];

      if (rows.length === 0) {
        console.log(`No data found in range: ${range}`);
        return [];
      }

      console.log(`Read ${rows.length} rows from range: ${range}`);
      return rows;
    } catch (error: any) {
      console.error(`Failed to read range ${range}:`, error.message);

      if (error.code === 404) {
        throw new Error(`Google Sheet not found or not accessible: ${sheetId}`);
      } else if (error.code === 403) {
        throw new Error(`Access denied to Google Sheet. Ensure the service account has access.`);
      } else if (error.message.includes('Unable to parse range')) {
        throw new Error(`Invalid range format: ${range}`);
      }

      throw new Error(`Failed to read Google Sheet: ${error.message}`);
    }
  }

  /**
   * Convert raw sheet rows to structured customer objects
   * @param rows - Raw rows from Google Sheets (first row is header)
   * @returns Array of customer objects with row numbers
   */
  parseCustomerRows(rows: any[][]): { rowNumber: number; data: Record<string, any> }[] {
    if (rows.length < 2) {
      return []; // No data rows (only header or empty)
    }

    const headers = rows[0].map((h: any) => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
    const dataRows = rows.slice(1);

    return dataRows.map((row, index) => {
      const rowObject: Record<string, any> = {};

      headers.forEach((header, colIndex) => {
        const value = row[colIndex];
        rowObject[header] = value === undefined || value === null ? '' : value;
      });

      return {
        rowNumber: index + 2, // +2 because index is 0-based and we skip header row
        data: rowObject,
      };
    }).filter(item => {
      // Filter out completely empty rows
      const values = Object.values(item.data);
      return values.some(v => v !== '' && v !== null && v !== undefined);
    });
  }

  /**
   * Convert raw sheet rows to structured order objects
   * @param rows - Raw rows from Google Sheets (first row is header)
   * @returns Array of order objects with row numbers
   */
  parseOrderRows(rows: any[][]): { rowNumber: number; data: Record<string, any> }[] {
    if (rows.length < 2) {
      return [];
    }

    const headers = rows[0].map((h: any) => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
    const dataRows = rows.slice(1);

    return dataRows.map((row, index) => {
      const rowObject: Record<string, any> = {};

      headers.forEach((header, colIndex) => {
        const value = row[colIndex];
        rowObject[header] = value === undefined || value === null ? '' : value;
      });

      return {
        rowNumber: index + 2,
        data: rowObject,
      };
    }).filter(item => {
      // Filter out completely empty rows
      const values = Object.values(item.data);
      return values.some(v => v !== '' && v !== null && v !== undefined);
    });
  }

  /**
   * Convert raw sheet rows to structured batch objects
   * @param rows - Raw rows from Google Sheets (first row is header)
   * @returns Array of batch objects with row numbers
   */
  parseBatchRows(rows: any[][]): { rowNumber: number; data: Record<string, any> }[] {
    if (rows.length < 2) {
      return [];
    }

    const headers = rows[0].map((h: any) => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
    const dataRows = rows.slice(1);

    return dataRows.map((row, index) => {
      const rowObject: Record<string, any> = {};

      headers.forEach((header, colIndex) => {
        const value = row[colIndex];
        rowObject[header] = value === undefined || value === null ? '' : value;
      });

      return {
        rowNumber: index + 2,
        data: rowObject,
      };
    }).filter(item => {
      // Filter out completely empty rows
      const values = Object.values(item.data);
      return values.some(v => v !== '' && v !== null && v !== undefined);
    });
  }

  /**
   * Get spreadsheet metadata (title, sheet names, etc.)
   * @param sheetId - The Google Sheet ID
   * @returns Spreadsheet metadata
   */
  async getSpreadsheetMetadata(sheetId: string): Promise<any> {
    this.ensureInitialized();

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: 'properties,sheets(properties)',
      });

      return {
        title: response.data.properties.title,
        sheets: response.data.sheets.map((sheet: any) => ({
          sheetId: sheet.properties.sheetId,
          title: sheet.properties.title,
          index: sheet.properties.index,
          rowCount: sheet.properties.gridProperties.rowCount,
          columnCount: sheet.properties.gridProperties.columnCount,
        })),
      };
    } catch (error: any) {
      console.error(`Failed to get spreadsheet metadata:`, error.message);
      throw new Error(`Failed to get spreadsheet metadata: ${error.message}`);
    }
  }

  /**
   * Utility: Convert Google Sheets serial date to ISO date string
   * Google Sheets stores dates as serial numbers (days since 1899-12-30)
   * @param serialDate - Serial date number from Google Sheets
   * @returns ISO date string (YYYY-MM-DD)
   */
  static serialDateToISO(serialDate: number): string {
    if (!serialDate || typeof serialDate !== 'number') {
      throw new Error('Invalid serial date');
    }

    // Google Sheets epoch: December 30, 1899
    const epoch = new Date(1899, 11, 30);
    const date = new Date(epoch.getTime() + serialDate * 24 * 60 * 60 * 1000);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Utility: Normalize date input to YYYY-MM-DD format
   * Handles strings, Date objects, and Google Sheets serial numbers
   * @param value - The date value from Google Sheets
   * @returns ISO date string (YYYY-MM-DD) or throws error
   */
  static normalizeDate(value: any): string {
    if (!value || value === '') {
      throw new Error('Date is required');
    }

    // If it's a number, treat as serial date
    if (typeof value === 'number') {
      return GoogleSheetsService.serialDateToISO(value);
    }

    // If it's a Date object
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // If it's a string
    if (typeof value === 'string') {
      const trimmed = value.trim();

      // Check if already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }

      // Try parsing other common formats
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    throw new Error(`Invalid date format: ${value}`);
  }

  /**
   * Utility: Normalize number input
   * @param value - The numeric value from Google Sheets
   * @returns Number or throws error
   */
  static normalizeNumber(value: any, fieldName: string): number {
    if (value === '' || value === null || value === undefined) {
      throw new Error(`${fieldName} is required`);
    }

    const num = typeof value === 'number' ? value : parseFloat(String(value));

    if (isNaN(num)) {
      throw new Error(`${fieldName} must be a valid number`);
    }

    return num;
  }

  /**
   * Utility: Normalize integer input
   * @param value - The integer value from Google Sheets
   * @returns Integer or throws error
   */
  static normalizeInteger(value: any, fieldName: string): number {
    const num = GoogleSheetsService.normalizeNumber(value, fieldName);

    if (!Number.isInteger(num)) {
      throw new Error(`${fieldName} must be a whole number`);
    }

    return num;
  }
}

// Singleton instance
let googleSheetsServiceInstance: GoogleSheetsService | null = null;

/**
 * Get or create Google Sheets service instance
 */
export function getGoogleSheetsService(): GoogleSheetsService {
  if (!googleSheetsServiceInstance) {
    googleSheetsServiceInstance = new GoogleSheetsService();
  }
  return googleSheetsServiceInstance;
}
