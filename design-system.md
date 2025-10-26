# Shrimp Broodstock Sales Report Platform - Design System

## Purpose

Provide a concise, actionable design system for a lightweight sales reporting platform to report broodstock sales to your superior. The system is optimized for quick executive summaries, traceable order records, and geospatial visibility of customers with verification credentials and simple stats.

## Audience and primary users

* Business development manager (you) for data entry and insight generation
* Supervisor receiving periodic reports and executive summaries
* Operations team for shipment and QC tracking
* Accounting for invoices and payments

## Guiding principles

* Accuracy over decoration: every datapoint must be traceable back to an order or document
* Minimal friction for entry: make the most common workflow 2 clicks if possible
* Action oriented reporting: highlight anomalies and recommended next actions
* Data hygiene first: validation and mandatory credential attachments for new customers

# MVP Feature Set

## Core screens

* Executive dashboard with KPI cards and sales progress plots
* Map view of customers with credential status and quick stats
* Orders table with search, filters, exports, and row expansion
* Order detail and customer profile pages
* Input form for new orders and for adding/updating customers

## Key components

* Map with clustered markers and customer tooltips
* Sales table with column customization and row expansion
* Sales progress plots (time series and breakdowns)
* KPI cards (total sales, active customers, average order size, pending shipments)
* Input form components (autocomplete customer, product selector, uploads)

# Data Model (entities and essential fields)

Provide strong constraints and clear ownership for each field. Use normalized relational schema. Use Postgres with PostGIS for location fields.

* Customer

  * id (uuid)
  * name
  * primary_contact_name
  * primary_contact_phone
  * email
  * address_text
  * latitude, longitude
  * country, province, district
  * credentials: array of credential objects (type, number, issued_date, expiry_date, file_url)
  * status: active | paused | blacklisted
  * created_by, created_at, updated_at

* Order

  * id (uuid)
  * order_number (unique human readable)
  * customer_id
  * order_date
  * species (eg Monodon / Black Tiger) and strain
  * broodstock_batch_id
  * quantity
  * unit_price_currency
  * total_value_currency
  * unit (piece) and packaging_type
  * shipment_date (planned), shipped_date (actual)
  * shipment_status: pending | shipped | delivered | problem
  * quality_flag: ok | minor_issue | critical_issue
  * mortality_reported (count) optional
  * test_results: array of test objects (test_type, date, pass_fail, file_url)
  * files: invoices, photos, certificates
  * notes
  * created_by, created_at, updated_at

* BroodstockBatch

  * id
  * batch_code
  * hatchery_origin
  * grade
  * arrival_date
  * available_quantity

* Invoice / Payment

  * id, order_id, amount, currency, status, issued_date, paid_date, payment_method, receipt_url

* User

  * id, name, role, email, last_login

* AuditLog

  * id, entity_type, entity_id, action, user_id, timestamp, diff

# Map design and interactions

* Base map: vector tiles via Mapbox or open alternative and Leaflet/MapLibre for client

* Marker visual states

  * Verified customer with valid credentials: green pin
  * Credential expiring or missing: yellow pin
  * Blacklisted or problematic: red pin
  * Clustering for dense areas with cluster count label

* Tooltip on hover or tap

  * Customer name
  * Last order date
  * Total value YTD
  * Credential short summary and link to view credential
  * Quick action buttons: new order, view profile, message

* Filters available on the map

  * Date range (last 30 days, quarter, year or custom)
  * Customer status
  * Species or strain purchased
  * Geographic region

* Map heat overlay option for sales volume intensity

# Orders table specification

* Columns recommended

  * Order number, Customer name, Country, Order date, Species, Quantity, Total value, Shipment status, Quality flag, Last test date, Actions

* Table features

  * Global search and column filters
  * Sortable columns and saved views
  * Row expansion to show line items and attachments
  * Inline actions: view order, edit, change shipment status, download invoice
  * Bulk actions: export selected, mark shipped, add note
  * Exports: CSV and Excel with audit trail link

# Sales progress and charts

* Dashboard layout

  * Top row: KPI cards (Total sales period, Active customers, Avg order size, Pending shipments)
  * Main chart area: cumulative sales line chart with target overlay and shaded anomaly regions
  * Secondary charts: stacked area or stacked bars by species or region, top 10 customers bar chart, shipments on time rate gauge
  * Table or small card list of anomalies detected: unexpected drop in quantity, spike from a single customer, failing tests

* Chart interactions

  * Brush selection on time series to filter table and map
  * Hover tooltips with order numbers and links
  * Legend toggles to show/hide series

# Input form for you (new order flow)

Form design goals

* Fast for repeat customers via autocomplete
* Require credentials for first-time customers
* Validate required business fields and file uploads

Fields and UX logic

* Customer selector (autocomplete) with ability to Add new customer modal

  * If adding new customer require: name, primary contact, address, country, credentials upload

* Order details

  * species (dropdown), strain (text), broodstock batch selector (optional), quantity (integer), unit price and currency, packaging type
  * calculated field: total_value = quantity * unit_price
  * required: payment terms, shipment method

* Shipment details

  * planned shipment date, destination pond/farm address (or customer address), preferred carrier

* QC and documentation

  * test_results input (test type, date, result, file upload)
  * photos upload (multiple)
  * notes and internal flags

* Validation rules

  * quantity must be positive integer
  * unit price must be numeric and not empty
  * for new customers require at least one credential file
  * automatic geocoding on address save with manual override

* Save behaviors

  * Save as Draft, Save and Submit (which triggers notifications to ops and accounting), Save and Print (PDF)

* Mobile microflow

  * The form should be progressive, showing only the minimal fields first and exposing advanced fields under an expandable section

# Component library and tokens

* Color palette tokens (WCAG AA compliant)

  | Token | Hex | Purpose |
  | --- | --- | --- |
  | `--brand-navy` | `#1B2554` | Primary chrome, sidebar gradients, dark text on light backgrounds |
  | `--brand-blue` | `#2F4EC8` | Primary actions, links, data highlights |
  | `--brand-sand` | `#F7F0E2` | Application canvas background |
  | `--brand-cream` | `#F4F3EF` | Secondary surface background |
  | `--brand-red` | `#B02A24` | Destructive actions, critical emphasis |
  | `success` (`--semantic-success`) | Base `#166246`, soft `#ECF9F3` | Verified credentials, positive KPIs |
  | `warning` (`--semantic-warning`) | Base `#A35A00`, soft `#FFF4E6` | Expiring credentials, cautionary banners |
  | `danger` (`--semantic-danger`) | Base `#B02A24`, soft `#FDEEF0` | Blocking errors, blacklisted customers |
  | `info` (`--semantic-info`) | Base `#2F4EC8`, soft `#E0E6FF` | Informational badges, neutral notifications |

  Base/soft pairings meet or exceed a 4.5:1 contrast ratio for body text and iconography when applied as `text-*` on `bg-*-100` utilities.

* Typography

  * headline, subhead, body, monospace for codes and order numbers

* Spacing and grid

  * 8px base spacing scale

* Components to implement

  * MapMarker, Cluster, CustomerTooltip
  * KPICard, ChartCard, Table, Paginator
  * FormField (text, number, dropdown, date, file upload), Modal, Autocomplete
  * Notification system and Audit timeline

# APIs and integration points

* Suggested endpoints (REST style)

  * GET /api/customers?filters
  * GET /api/customers/{id}
  * POST /api/customers
  * GET /api/orders?filters
  * POST /api/orders
  * GET /api/orders/{id}
  * PUT /api/orders/{id}
  * POST /api/reports/sales?range
  * GET /api/map/customers?geo_bbox

* File storage for credentials and invoices: object storage with signed URLs

* Geocoding: server-side or client-side calling a geocoding service; store lat and lon in DB

* Optional integrations: accounting system, shipment tracking, lab results portal

# Security, permissions and audit

* Roles

  * Viewer: read only
  * Editor: create and edit orders and customers
  * Manager: approve orders and export reports
  * Admin: user management

* Rules

  * Audit log for any create, update, delete with user and diff
  * Sensitive fields encrypted in DB if necessary
  * Signed URLs for file downloads

# Data quality and operational controls

* Required fields for new customers and orders
* Deduplication check when adding a customer using name, phone, and geolocation
* Credential expiry monitoring with weekly alerts
* Mandatory QC test upload for specific high risk strains or markets

# Reporting for your superior

* Executive summary card (to include in periodic report)

  * Top 3 highlights this period (text notes written by you)
  * Top 3 risks or anomalies requiring attention
  * Quick snapshot KPIs

* Scheduled report options

  * Weekly email with 1 page PDF summary and CSV attachment
  * Monthly deep dive with trend plots and top customer analysis

# Analytics ideas beyond MVP

* Cohort analysis by customer acquisition source
* Lifetime value forecast per customer
* Forecasting future sales using simple time series models and flags for anomalies
* Quality tracking: correlate broodstock shipment health with supplier and hatchery origin

# Technology suggestions

* Frontend

  * React with framework of choice for quick iteration
  * Map: MapLibre or Leaflet with vector tiles
  * Charts: Recharts or Chart.js

* Backend

  * Postgres with PostGIS extension
  * Node.js with Express or Python with FastAPI
  * File storage on S3-compatible object store

# Acceptance criteria and sample user stories

* As a business development manager I can add an order in under 3 minutes for an existing customer
* As a supervisor I can open the dashboard and see top level KPIs and last period comparison
* As an operations user I can filter map to show customers with shipments pending this week
* As an auditor I can see who changed the order and when with a field-level diff

# Appendix

## CSV import template columns

* customer_name, contact_name, phone, email, address, country, latitude, longitude, order_number, order_date, species, strain, quantity, unit_price, currency, shipment_date, shipment_status

## Example JSON payload for creating an order

```json
{
  "customer_id": "uuid",
  "order_date": "2025-09-30",
  "species": "Penaeus monodon",
  "strain": "local_x",
  "quantity": 100,
  "unit_price": 25.5,
  "currency": "USD",
  "shipment_date": "2025-10-05",
  "files": [
    {"type": "invoice", "url": "signed-url"}
  ],
  "notes": "Handle as priority shipment"
}
```

Notes

* The design balances quick operational entry with traceable compliance documents. The most common sources of friction in similar systems are inconsistent customer addresses and missing credential files. Enforce credentials on first sale and implement simple deduplication.

Next steps

* I can convert this into an interactive prototype or a single-file React page with the dashboard, map and table components stubbed out. Tell me which part you want first and I will produce it.

End of document
