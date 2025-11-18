# Google Sheets Sync - Quick Start Guide

## ✅ What's Been Implemented

The complete one-way Google Sheets sync system has been successfully implemented with:

### Backend (/backend)
- ✅ Database migration (`migrations/004_google_sheets_sync.sql`)
- ✅ Sync models and schemas (`src/models/sync.ts`)
- ✅ Google Sheets service (`src/services/googleSheetsService.ts`)
- ✅ Validation service (`src/services/validationService.ts`)
- ✅ Sync orchestration service (`src/services/syncService.ts`)
- ✅ API routes (`src/routes/sync.ts`)
- ✅ Environment configuration (`.env.example` updated)
- ✅ NPM packages installed (googleapis, google-auth-library)

### Frontend (/frontend)
- ✅ Google Sheets Sync component (`src/components/settings/GoogleSheetsSync.tsx`)
- ✅ Settings page integration (new "Google Sheets Sync" tab)
- ✅ Real-time sync status display
- ✅ Error reporting and CSV export
- ✅ Sync history view

---

## 🚀 Next Steps to Test

### Step 1: Run Database Migration

```bash
cd /Users/macbook/Documents/sales-report/backend
npm run migrate:run
```

This creates the required tables:
- `sync_config`
- `sync_jobs`
- `sync_errors`
- `sync_audit_log`

### Step 2: Create Google Cloud Service Account

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or Select Project**
3. **Enable Google Sheets API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. **Create Service Account**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Name: `broodstock-sync-service`
   - Skip role assignment
   - Click "Done"
5. **Generate JSON Key**:
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create New Key"
   - Choose **JSON**
   - Download and save securely

### Step 3: Configure Backend

1. **Save credentials file**:
   ```bash
   mkdir -p /Users/macbook/Documents/sales-report/backend/config
   # Move downloaded JSON to:
   # /Users/macbook/Documents/sales-report/backend/config/google-service-account.json
   ```

2. **Update backend `.env`**:
   ```env
   GOOGLE_SHEETS_ENABLED=true
   GOOGLE_SHEETS_CREDENTIALS_PATH=./config/google-service-account.json
   GOOGLE_SHEETS_MASTER_SHEET_ID=YOUR_SHEET_ID_HERE
   GOOGLE_SHEETS_CUSTOMER_RANGE=Customers!A:Z
   GOOGLE_SHEETS_ORDER_RANGE=Orders!A:Z
   GOOGLE_SHEETS_BATCH_RANGE=Batches!A:Z
   ```

### Step 4: Create Test Google Sheet

1. **Create new Google Sheet**
2. **Create 3 tabs**: `Customers`, `Orders`, `Batches`

3. **Customers tab** - Add this header row (Row 1):
   ```
   name | primary_contact_name | email | phone | address | country | province | district | latitude | longitude | status | credential_type_1 | credential_number_1 | credential_issued_1 | credential_expiry_1 | credential_file_url_1
   ```

4. **Orders tab** - Add this header row (Row 1):
   ```
   customer_email | order_date | species | strain | quantity | unit_price | unit | unit_price_currency | total_value_currency | broodstock_batch_code | packaging_type | shipment_date | shipment_status | quality_flag | mortality_reported | notes
   ```

5. **Batches tab** - Add this header row (Row 1):
   ```
   batch_code | hatchery_origin | grade | arrival_date | available_quantity | initial_quantity | species | strain | age_weeks | weight_grams | health_status | quarantine_status | notes
   ```

6. **Add test data** (Row 2 onwards):

   **Customers example**:
   ```
   Thai Aquaculture Ltd | John Smith | john@thaiaqua.com | +66-123-456 | 123 Bangkok Rd | Thailand | Bangkok | Pathum Wan | 13.7563 | 100.5018 | active | license | LIC-001 | 2024-01-01 | 2026-01-01 | https://example.com/cert1.pdf
   ```

   **Batches example** (add before orders):
   ```
   BATCH-2025-001 | Coastal Hatchery | Premium | 2025-01-10 | 5000 | 5000 | Penaeus vannamei | SPF | 12 | 15.5 | excellent | completed |
   ```

   **Orders example**:
   ```
   john@thaiaqua.com | 2025-01-15 | Penaeus vannamei | SPF | 1000 | 25.50 | piece | USD | USD | BATCH-2025-001 | Styrofoam boxes | 2025-01-20 | shipped | ok | 5 | High quality batch
   ```

7. **Share with service account**:
   - Click "Share" button
   - Add the service account email from JSON (`client_email`)
   - Permission: **Viewer**
   - Uncheck "Notify people"
   - Click "Share"

8. **Get Sheet ID** from URL:
   ```
   https://docs.google.com/spreadsheets/d/1abc123xyz456/edit
                                          ↑
                                    This is your Sheet ID
   ```

### Step 5: Start Backend & Frontend

**Terminal 1 - Backend**:
```bash
cd /Users/macbook/Documents/sales-report/backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd /Users/macbook/Documents/sales-report/frontend
npm run dev
```

### Step 6: Test the Sync

1. **Open frontend**: http://localhost:3000
2. **Login** with your credentials
3. **Go to**: Dashboard → Settings → **Google Sheets Sync** tab
4. **Configure Sheet ID**:
   - Click "Edit" next to Google Sheet ID field
   - Paste your Sheet ID
   - Click "Save"
5. **Click "Sync Now"**
6. **Watch real-time progress**
7. **Check results**:
   - ✅ Success: Records inserted count
   - ⚠️ Partial: Download error report
   - ❌ Failed: Check error details

### Step 7: Verify Data

```bash
# Connect to database
psql -h localhost -U postgres -d broodstock_sales

# Check inserted data
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM broodstock_batches;
SELECT COUNT(*) FROM orders;

# Check sync history
SELECT * FROM sync_jobs ORDER BY started_at DESC LIMIT 5;

# Check for errors
SELECT * FROM sync_errors WHERE sync_job_id = 'YOUR_JOB_ID';
```

---

## 📋 Test Scenarios

### Scenario 1: Fresh Import
- Add 5 customers, 3 batches, 10 orders
- Click Sync Now
- **Expected**: All records inserted successfully

### Scenario 2: Duplicate Detection
- Run sync again with same data
- **Expected**: All records skipped (insert-only mode)

### Scenario 3: Invalid Data
- Add customer with invalid email
- Add order with future date
- Add batch with negative quantity
- **Expected**: Validation errors, download error CSV

### Scenario 4: Missing References
- Add order referencing non-existent customer email
- **Expected**: Missing reference error

### Scenario 5: Partial Success
- Mix valid and invalid records
- **Expected**: Valid records inserted, invalid ones reported

---

## 🐛 Troubleshooting

### Issue: "Access denied to Google Sheet"
**Solution**: Share sheet with service account email (from JSON)

### Issue: "Credentials file not found"
**Solution**: Check path in .env matches actual file location

### Issue: "Customer with email X already exists"
**Solution**: Expected in insert-only mode. Remove from sheet or delete from DB

### Issue: "Customer with email X not found" (for orders)
**Solution**: Sync customers first, or add customer to Customers tab

### Issue: Sync stays in "running" status
**Solution**: Check backend logs for errors, verify DB connection

### Issue: Frontend API calls fail
**Solution**:
- Check `NEXT_PUBLIC_API_URL` in frontend/.env
- Verify backend is running on correct port
- Check browser console for CORS errors

---

## 📚 Documentation

- **Full Setup Guide**: `/GOOGLE_SHEETS_SYNC.md`
- **API Documentation**: `/API_DOCUMENTATION.md`
- **Backend README**: `/backend/README.md`

---

## 🎯 Success Criteria

✅ Database migration runs without errors
✅ Backend starts with no Google Sheets errors
✅ Frontend Settings page shows Sync tab
✅ Can configure Sheet ID in UI
✅ Sync button triggers sync job
✅ Real-time status updates work
✅ Valid data inserts successfully
✅ Invalid data generates error report
✅ Duplicates are skipped
✅ Sync history displays correctly

---

## 🔥 Quick Commands

```bash
# Run migration
npm run migrate:run

# Start backend
npm run dev

# Check logs
# (backend logs will show sync progress)

# Download error report
# Available in UI after failed sync
```

---

## 💡 Tips

1. **Start small**: Test with 2-3 records per sheet first
2. **Check order**: Always sync Customers → Batches → Orders
3. **Use exact formats**: Dates must be YYYY-MM-DD
4. **Watch console**: Backend logs show detailed progress
5. **Download template**: Click "Download Template" button in UI
6. **Test validation**: Try invalid data to see error handling

---

## ✨ Next Features (Future)

- [ ] Scheduled automatic sync (cron)
- [ ] Webhook-based real-time sync
- [ ] Upsert mode (allow updates)
- [ ] Bi-directional sync
- [ ] Custom field mapping UI
- [ ] Dry-run mode (validate without inserting)

---

**Ready to test?** Follow the steps above and the sync should work perfectly! 🚀
