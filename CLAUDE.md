# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Shrimp Broodstock Sales Report Platform designed for lightweight sales reporting with executive summaries, traceable order records, and geospatial customer visibility. The system is optimized for business development managers to track aquaculture broodstock sales.

## Architecture

The platform follows a standard web application architecture with:

- **Frontend**: React-based application with MapLibre/Leaflet for geospatial features and Recharts/Chart.js for analytics
- **Backend**: REST API using Node.js/Express or Python/FastAPI
- **Database**: PostgreSQL with PostGIS extension for geospatial data
- **File Storage**: S3-compatible object storage for credentials, invoices, and photos

### Core Data Model

The system centers around five main entities:

1. **Customer** - Contains contact info, credentials, and geolocation data
2. **Order** - Links customers to broodstock sales with shipment tracking
3. **BroodstockBatch** - Inventory tracking for hatchery stock
4. **Invoice/Payment** - Financial transaction records
5. **AuditLog** - Complete change tracking for compliance

### Key Features

- **Executive Dashboard**: KPI cards and sales progress visualization
- **Interactive Map**: Customer locations with credential status indicators
- **Orders Management**: Searchable table with filters and bulk operations
- **Form-based Entry**: Optimized for 2-click workflows with autocomplete
- **Compliance Tracking**: Mandatory credential uploads and expiry monitoring

## Design Principles

- **Accuracy over decoration**: Every data point must be traceable to source documents
- **Minimal friction**: Most common workflows should take 2 clicks or less
- **Action-oriented reporting**: Highlight anomalies and recommend next steps
- **Data hygiene first**: Validation and mandatory credentials for new customers

## File Organization

- `design-system.md` - Complete system design specification with data models, UI components, and technical requirements

## Technology Stack

Based on design specifications:
- React for frontend components
- MapLibre or Leaflet for mapping functionality
- PostgreSQL with PostGIS for geospatial queries
- Object storage (S3-compatible) for file management
- REST API architecture for backend services

## Development Notes

When implementing features:
- Follow the 8px spacing scale defined in the design system
- Use semantic color names (success, warning, danger, neutral)
- Implement progressive forms for mobile compatibility
- Ensure all customer interactions require credential verification
- Maintain audit trail for all data modifications
- Use UUID for primary keys across all entities