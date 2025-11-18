# Google Sheets Sync Integration

## Overview

This system supports one-way synchronization from Google Sheets to the PostgreSQL database. This allows non-technical users to enter data using familiar spreadsheet interfaces while maintaining database integrity and validation.

## Features

- ✅ **One-Way Sync**: Google Sheets → Database (Sheets as data entry, DB as source of truth)
- ✅ **Manual Trigger**: User-initiated sync via UI button
- ✅ **Insert-Only Mode**: Prevents accidental data overwrites (duplicates are skipped)
- ✅ **Comprehensive Validation**: Type checking, business rules, referential integrity
- ✅ **Detailed Error Reporting**: Row-level errors with CSV export
- ✅ **Foreign Key Lookup**: Automatic resolution (email → customer_id, batch_code → batch_id)
- ✅ **Audit Trail**: Complete tracking of all synced records
- ✅ **Geolocation Support**: Automatic PostGIS point creation from lat/lng
- ✅ **Auth-Guarded**: Only authenticated admins/managers can trigger or change sync config

## Architecture

```
Google Sheets (Data Entry)
    ↓
Google Sheets API (Read-Only)
    ↓
Validation Pipeline
    ↓
Foreign Key Resolution
    ↓
PostgreSQL Database (Source of Truth)
    ↓
Backend API
    ↓
Frontend UI
```

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google Sheets API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in details:
   - **Name**: `broodstock-sync-service`
   - **Description**: `Service account for Google Sheets sync`
4. Click "Create and Continue"
5. Grant role: **None** (we'll use direct sheet sharing)
6. Click "Done"

### 3. Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create New Key"
4. Choose **JSON** format
5. Click "Create"
6. Save the downloaded JSON file securely

### 4. Configure Backend

1. Copy the service account JSON file to your backend:
   ```bash
   mkdir -p /Users/macbook/Documents/sales-report/backend/config
   cp ~/Downloads/your-service-account-key.json /Users/macbook/Documents/sales-report/backend/config/google-service-account.json
   ```

2. Update your backend `.env` file:
   ```env
   GOOGLE_SHEETS_ENABLED=true
   GOOGLE_SHEETS_CREDENTIALS_PATH=/app/config/google-service-account.json
   GOOGLE_SHEETS_MASTER_SHEET_ID=your-sheet-id-here
   GOOGLE_SHEETS_CUSTOMER_RANGE=Customers!A:Z
GOOGLE_SHEETS_ORDER_RANGE=Orders!A:Z
GOOGLE_SHEETS_BATCH_RANGE=Batches!A:Z
   ```

3. These env values are used as defaults; DB config can override them via `sync_config`, and unset DB values fall back to `.env`.

### 5. Run Database Migration

```bash
cd /Users/macbook/Documents/sales-report/backend
npm run migrate:run
```

This will create the required sync tables:
- `sync_config`
- `sync_jobs`
- `sync_errors`
- `sync_audit_log`

### 6. Create Google Sheet

1. Create a new Google Sheet or use existing
2. Create three tabs:
   - **Customers**
   - **Orders**
   - **Batches**

3. Get the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/1abc123xyz456/edit
                                          ↑
                                    This is the Sheet ID
   ```

4. **Share the sheet** with the service account email:
   - Open the Google Sheet
   - Click "Share" button
   - Add the service account email (found in the JSON file as `client_email`)
   - Example: `broodstock-sync-service@project-12345.iam.gserviceaccount.com`
   - Set permission to **Viewer** (read-only)
   - Uncheck "Notify people"
   - Click "Share"

### 7. Configure Sheet Headers

#### Customers Tab (Row 1):
```
name | primary_contact_name | email | phone | address | country | province | district | latitude | longitude | status | credential_type_1 | credential_number_1 | credential_issued_1 | credential_expiry_1 | credential_file_url_1
```

#### Orders Tab (Row 1):
```
customer_email | order_date | species | strain | quantity | unit_price | unit | unit_price_currency | total_value_currency | broodstock_batch_code | packaging_type | shipment_date | shipment_status | quality_flag | mortality_reported | notes
```

#### Batches Tab (Row 1):
```
batch_code | hatchery_origin | grade | arrival_date | available_quantity | initial_quantity | species | strain | age_weeks | weight_grams | health_status | quarantine_status | notes
```

### 8. Update Sync Configuration

Use the API or database to configure:

```sql
UPDATE sync_config SET config_value = 'true' WHERE config_key = 'google_sheets_enabled';
UPDATE sync_config SET config_value = 'YOUR_SHEET_ID' WHERE config_key = 'google_sheets_master_sheet_id';
```

Or via API:
```bash
curl -X PUT http://localhost:3001/api/v1/sync/google-sheets/config/google_sheets_enabled \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"config_value": "true"}'
```

## Usage

### Data Entry Workflow

1. **Open Google Sheet** in browser or Excel
2. **Enter data** in appropriate tab
3. **Follow format requirements** (see Data Format section below)
4. **Save** (auto-saves in Google Sheets)
5. **Go to app UI** → Settings → Google Sheets Sync
6. **Click "Sync Now"**
7. **Wait for completion** (status updates in real-time)
8. **Review results**:
   - ✅ Success: Records inserted count
   - ⚠️ Partial: Some records inserted, some failed
   - ❌ Failed: Download error report CSV

### Data Format Requirements

#### Customers
- **Required**: `name`, `primary_contact_name`, and either `email` OR `phone`
- **Dates**: YYYY-MM-DD format (e.g., `2025-01-15`)
- **Lat/Lng**: Both must be provided together, decimal format (e.g., `13.7563`, `100.5018`)
- **Status**: `active`, `paused`, or `blacklisted`
- **Credentials**: Can provide up to 3 credentials using `_1`, `_2`, `_3` suffixes
- **Duplicates**: Checked by email (case-insensitive)

#### Orders
- **Required**: `customer_email`, `order_date`, `species`, `quantity`, `unit_price`
- **Customer Lookup**: `customer_email` must match an existing customer's email
- **Batch Lookup**: `broodstock_batch_code` must match an existing batch (optional)
- **Dates**: YYYY-MM-DD format
- **Numbers**: Quantity must be integer, price must be positive
- **Status**: `pending`, `shipped`, `delivered`, or `problem`
- **Quality**: `ok`, `minor_issue`, or `critical_issue`

#### Batches
- **Required**: `batch_code`, `hatchery_origin`, `arrival_date`, `available_quantity`
- **Dates**: YYYY-MM-DD format
- **Numbers**: Quantities must be non-negative integers
- **Health**: `excellent`, `good`, `fair`, or `poor`
- **Quarantine**: `pending`, `in_progress`, `completed`, or `failed`
- **Duplicates**: Checked by batch_code

### API Endpoints

#### Trigger Sync
```http
POST /api/v1/sync/google-sheets/trigger
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "sheet_id": "optional-override-sheet-id",
  "sheets_to_sync": ["customers", "orders", "batches"],
  "mode": "insert_only"
}

Response:
{
  "success": true,
  "message": "Sync job started",
  "data": {
    "sync_job_id": "uuid",
    "status": "pending",
    "started_at": "2025-01-15T10:30:00Z"
  }
}
```

#### Get Sync Status
```http
GET /api/v1/sync/google-sheets/status/:jobId

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "records_processed": 125,
    "records_inserted": 100,
    "records_skipped": 15,
    "records_failed": 10,
    "customers_inserted": 25,
    "orders_inserted": 50,
    "batches_inserted": 25,
    "error_summary": {
      "customer_errors": 5,
      "order_errors": 3,
      "batch_errors": 2
    },
    "started_at": "...",
    "completed_at": "..."
  }
}
```

#### Get Sync Errors
```http
GET /api/v1/sync/google-sheets/errors/:jobId

Response:
{
  "success": true,
  "data": [
    {
      "row_number": 5,
      "sheet_name": "Customers",
      "entity_type": "customer",
      "error_type": "validation_error",
      "error_message": "email: Invalid email format",
      "field_name": "email",
      "invalid_value": "not-an-email",
      "data_snapshot": { ... }
    }
  ],
  "pagination": { ... }
}
```

#### Export Errors as CSV
```http
GET /api/v1/sync/google-sheets/errors/:jobId/export

Response: CSV file download
```

#### Get Sync History
```http
GET /api/v1/sync/google-sheets/history?limit=20&offset=0&status=completed

Response:
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... }
}
```

## Validation Rules

### Customer Validation
- ✅ Email format validation
- ✅ Lat/Lng range validation (-90 to 90, -180 to 180)
- ✅ Both lat/lng must be provided together
- ✅ At least email OR phone required
- ✅ No duplicate emails (case-insensitive)
- ✅ Credential dates in YYYY-MM-DD format
- ✅ Credential expiry must be after issued date

### Order Validation
- ✅ Customer email must exist in database
- ✅ Batch code must exist if provided
- ✅ Quantity > 0 and integer
- ✅ Unit price > 0
- ✅ Mortality ≤ quantity
- ✅ Order date not in future
- ✅ Shipment date ≥ order date

### Batch Validation
- ✅ Batch code uniqueness
- ✅ Available quantity ≤ initial quantity
- ✅ All quantities ≥ 0
- ✅ Age and weight > 0 if provided
- ✅ Arrival date not in future

## Error Handling

### Common Errors

1. **"Customer with email X already exists"**
   - Cause: Insert-only mode, customer already in DB
   - Solution: Remove row from sheet or change email

2. **"Customer with email X not found"**
   - Cause: Order references non-existent customer
   - Solution: Ensure customer is synced first, or add to Customers tab

3. **"Batch with code X not found"**
   - Cause: Order references non-existent batch
   - Solution: Ensure batch is synced first, or add to Batches tab

4. **"Invalid date format"**
   - Cause: Date not in YYYY-MM-DD format
   - Solution: Use format: 2025-01-15

5. **"Access denied to Google Sheet"**
   - Cause: Service account not granted access
   - Solution: Share sheet with service account email

## Sync Order

The sync process runs in this order to respect foreign key constraints:

1. **Customers** (no dependencies)
2. **Batches** (no dependencies)
3. **Orders** (depends on Customers and Batches)

Always ensure customers and batches exist before syncing orders that reference them.

## Security & Permissions

- Only **admin** and **manager** roles can trigger sync
- Service account has **read-only** access to sheets
- Credentials file should be kept secure
- Don't commit credentials to git
- All sync operations are logged in audit trail

## Troubleshooting

### Sync fails with "not initialized"
- Check service account JSON file exists at configured path
- Verify file permissions (readable by app)

### Sync fails with "404 not found"
- Check sheet ID is correct
- Verify sheet hasn't been deleted
- Confirm service account has access

### Sync fails with "403 forbidden"
- Service account not shared on the sheet
- Share sheet with service account email (found in JSON as `client_email`)

### All rows are skipped
- Check for duplicate keys (email, batch_code)
- Verify data isn't already in database
- Check validation errors in error report

### Foreign key errors
- Ensure customers/batches are synced before orders
- Verify email/batch_code values match exactly (case-sensitive for batch_code)

## Performance

- Typical sync speed: ~100-200 records/minute
- Syncs run asynchronously (non-blocking)
- Large datasets (>1000 rows) may take several minutes
- Database transactions ensure data consistency

## Limits

- Google Sheets API: 60 requests/minute per user
- Max rows per sheet: 10,000,000 cells total
- Recommended batch size: <5,000 rows per sync
- Error report CSV: Max 10,000 errors

## Future Enhancements

- [ ] Scheduled automatic sync (cron jobs)
- [ ] Webhook-based real-time sync
- [ ] Upsert mode (allow updates)
- [ ] Bi-directional sync
- [ ] Multiple sheet support
- [ ] Dry-run mode (validate without inserting)
- [ ] Bulk delete via sheets
- [ ] Custom field mapping configuration

## Support

For issues or questions:
1. Check error report CSV for validation details
2. Review sync job history for patterns
3. Check backend logs for detailed error messages
4. Verify Google Sheets API quota hasn't been exceeded
5. Ensure service account credentials are valid

## Example Google Sheet Template

Download template: `GET /api/v1/sync/google-sheets/template`

Or create manually following the header specifications above.
