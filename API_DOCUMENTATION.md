# Shrimp Broodstock Sales Platform - API Documentation

## Overview

This document provides comprehensive documentation for the Shrimp Broodstock Sales Platform API. The API follows RESTful principles and returns JSON responses.

**Base URL**: `http://localhost:3001/api/v1`  
**Authentication**: Bearer token (JWT)  
**Content-Type**: `application/json`

## Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "role": "editor"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token-here"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer your-access-token
```

## Customers API

### List Customers
```http
GET /customers?limit=20&offset=0&status=active&search=coastal
Authorization: Bearer your-access-token
```

**Query Parameters:**
- `status`: active, paused, blacklisted
- `country`: Country code
- `search`: Search in name, contact, email, phone
- `has_valid_credentials`: boolean
- `credential_expiring_days`: number
- `limit`: 1-100 (default: 20)
- `offset`: number (default: 0)
- `sort_by`: name, created_at, updated_at
- `sort_order`: asc, desc

### Get Customer by ID
```http
GET /customers/{id}
Authorization: Bearer your-access-token
```

### Create Customer
```http
POST /customers
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "name": "Coastal Aquaculture Ltd.",
  "primary_contact_name": "Roberto Silva",
  "primary_contact_phone": "+66-2-555-0123",
  "email": "roberto@coastal-aqua.com",
  "address_text": "123 Harbor Drive, Samut Prakan, Thailand",
  "latitude": 13.5993,
  "longitude": 100.5918,
  "country": "Thailand",
  "province": "Samut Prakan",
  "district": "Muang",
  "status": "active",
  "credentials": [
    {
      "type": "license",
      "number": "AQ-TH-2024-001",
      "issued_date": "2024-01-01",
      "expiry_date": "2025-01-01",
      "file_url": "https://example.com/cert1.pdf"
    }
  ]
}
```

### Update Customer
```http
PUT /customers/{id}
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "status": "paused",
  "notes": "Temporary pause due to maintenance"
}
```

### Get Nearby Customers
```http
GET /customers/nearby?latitude=13.5993&longitude=100.5918&radius=50
Authorization: Bearer your-access-token
```

### Check Duplicate Customer
```http
GET /customers/check-duplicate?name=Coastal%20Aquaculture&phone=+66-2-555-0123
Authorization: Bearer your-access-token
```

## Orders API

### List Orders
```http
GET /orders?limit=20&offset=0&shipment_status=pending&include_customer=true
Authorization: Bearer your-access-token
```

**Query Parameters:**
- `customer_id`: UUID
- `broodstock_batch_id`: UUID
- `species`: string
- `shipment_status`: pending, shipped, delivered, problem
- `quality_flag`: ok, minor_issue, critical_issue
- `order_date_from`: YYYY-MM-DD
- `order_date_to`: YYYY-MM-DD
- `min_quantity`, `max_quantity`: numbers
- `min_value`, `max_value`: numbers
- `currency`: 3-letter code
- `search`: string
- `include_customer`: boolean
- `include_batch`: boolean

### Get Order by ID
```http
GET /orders/{id}
Authorization: Bearer your-access-token
```

### Create Order
```http
POST /orders
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "customer_id": "customer-uuid-here",
  "broodstock_batch_id": "batch-uuid-here",
  "order_date": "2024-09-30",
  "species": "Penaeus monodon",
  "strain": "Black Tiger Premium",
  "quantity": 100,
  "unit_price": 25.50,
  "unit_price_currency": "USD",
  "total_value_currency": "USD",
  "shipment_date": "2024-10-05",
  "notes": "High priority order"
}
```

### Update Order
```http
PUT /orders/{id}
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "shipment_status": "shipped",
  "quality_flag": "ok",
  "notes": "Shipped on schedule"
}
```

### Bulk Update Orders
```http
PATCH /orders/bulk-update
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "order_ids": ["uuid1", "uuid2", "uuid3"],
  "shipment_status": "shipped",
  "notes": "Bulk shipment processed"
}
```

### Get Order Statistics
```http
GET /orders/stats/summary
Authorization: Bearer your-access-token
```

### Get Revenue by Month
```http
GET /orders/stats/revenue-by-month?months=12
Authorization: Bearer your-access-token
```

### Get Top Species
```http
GET /orders/stats/top-species?limit=10&period_days=30
Authorization: Bearer your-access-token
```

## Broodstock Batches API

### List Batches
```http
GET /broodstock-batches?available_only=true&hatchery_origin=Pacific
Authorization: Bearer your-access-token
```

**Query Parameters:**
- `hatchery_origin`: string
- `grade`: string
- `species`: string
- `health_status`: excellent, good, fair, poor
- `quarantine_status`: pending, in_progress, completed, failed
- `available_only`: boolean
- `arrival_date_from`, `arrival_date_to`: YYYY-MM-DD
- `min_quantity`, `max_quantity`: numbers

### Create Batch
```http
POST /broodstock-batches
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "batch_code": "BST-2024-005",
  "hatchery_origin": "Pacific Hatchery Co.",
  "grade": "Premium",
  "arrival_date": "2024-10-01",
  "available_quantity": 500,
  "species": "Penaeus monodon",
  "strain": "Black Tiger Premium",
  "age_weeks": 12.5,
  "weight_grams": 25.0,
  "health_status": "excellent",
  "quarantine_status": "completed"
}
```

### Get Low Stock Batches
```http
GET /broodstock-batches/low-stock?threshold=10
Authorization: Bearer your-access-token
```

### Get Batch Statistics
```http
GET /broodstock-batches/stats
Authorization: Bearer your-access-token
```

## File Management API

### Upload Documents
```http
POST /files/upload/documents
Authorization: Bearer your-access-token
Content-Type: multipart/form-data

documents: [file1.pdf, file2.jpg]
```

### Upload Credentials
```http
POST /files/upload/credentials
Authorization: Bearer your-access-token
Content-Type: multipart/form-data

credentials: [license.pdf, permit.jpg]
```

### Download File
```http
GET /files/{filename}
Authorization: Bearer your-access-token
```

### Generate Signed URL (S3 only)
```http
GET /files/signed-url/{filename}?expires=3600
Authorization: Bearer your-access-token
```

## Geocoding API

### Geocode Address
```http
POST /geocoding/geocode
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "address": "123 Harbor Drive, Samut Prakan, Thailand",
  "limit": 5
}
```

### Reverse Geocode
```http
POST /geocoding/reverse
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "latitude": 13.5993,
  "longitude": 100.5918
}
```

### Calculate Distance
```http
POST /geocoding/distance
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "from": {"latitude": 13.5993, "longitude": 100.5918},
  "to": {"latitude": 14.4818, "longitude": 120.9819}
}
```

## Business Logic API

### Calculate Order Totals
```http
POST /business/calculate-order
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "quantity": 100,
  "unit_price": 25.50,
  "currency": "USD",
  "customer_id": "customer-uuid",
  "species": "Penaeus monodon",
  "country": "TH",
  "estimated_weight_kg": 2.5
}
```

### Validate Order Rules
```http
POST /business/validate-order
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "customer_id": "customer-uuid",
  "species": "Penaeus monodon",
  "quantity": 100,
  "total_value": 2550
}
```

### Get Recommended Pricing
```http
POST /business/recommended-pricing
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "species": "Penaeus monodon",
  "quantity": 100,
  "customer_id": "customer-uuid"
}
```

### Get Customer Tier
```http
GET /business/customer-tier/{customerId}
Authorization: Bearer your-access-token
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "details": "Additional error details"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "pages": 8
    }
  }
}
```

## Error Codes

- **400 Bad Request**: Invalid request data or parameters
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions for the operation
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists or conflict with current state
- **422 Unprocessable Entity**: Validation error
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

## Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **File uploads**: 50 uploads per hour per IP
- **Geocoding**: 1 request per second (OpenStreetMap limitation)

## Data Types

### Customer Status
- `active`: Customer can place orders
- `paused`: Customer temporarily inactive
- `blacklisted`: Customer blocked from orders

### Shipment Status
- `pending`: Order created, not yet shipped
- `shipped`: Order has been shipped
- `delivered`: Order confirmed delivered
- `problem`: Issue with shipment

### Quality Flag
- `ok`: No quality issues
- `minor_issue`: Minor quality concerns
- `critical_issue`: Serious quality problems

### User Roles
- `viewer`: Read-only access
- `editor`: Can create and edit orders/customers
- `manager`: Can approve orders and export reports
- `admin`: Full system access

## Webhooks (Future Enhancement)

The system is designed to support webhooks for real-time notifications:

- Order status changes
- Low stock alerts
- Customer credential expiry
- Payment confirmations

## SDK and Client Libraries

Currently, the API can be accessed using any HTTP client. Future versions may include:

- JavaScript/TypeScript SDK
- Python client library
- Mobile SDKs (React Native, Flutter)

## Testing

Use the health endpoint to verify API availability:

```http
GET /health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-09-30T10:30:00.000Z",
  "environment": "development"
}
```

## Support

For API support and questions:
- Check the error message and status code
- Verify authentication token validity
- Ensure request format matches documentation
- Check rate limits

## Changelog

### v1.0.0 (Current)
- Initial API release
- Complete CRUD operations for customers, orders, batches
- Authentication and authorization
- File management
- Geocoding services
- Business logic calculations
- Comprehensive filtering and search