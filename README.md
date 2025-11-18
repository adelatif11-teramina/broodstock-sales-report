# Shrimp Broodstock Sales Report Platform

A comprehensive sales reporting platform for aquaculture broodstock sales with executive dashboards, order tracking, and geospatial customer management.

## 🚀 Phase 1 Complete: Foundation & Setup

### ✅ What's Been Implemented

#### Backend (Node.js + TypeScript + Express)
- **Project Structure**: Organized backend with proper TypeScript configuration
- **Database Setup**: PostgreSQL with PostGIS extension for geospatial data
- **Authentication**: JWT-based auth with role-based access control (RBAC)
- **File Storage**: Configurable file upload system (local + S3-compatible)
- **Database Migrations**: Complete schema with audit trails and sample data
- **API Security**: Rate limiting, CORS, input validation, error handling
- **Development Tools**: ESLint, Prettier, nodemon for hot reloading

#### Frontend (Next.js + TypeScript + Tailwind)
- **Project Structure**: Next.js 14 with app router and TypeScript
- **Dependencies**: MapLibre GL, Recharts, React Query, React Hook Form, Zod
- **Development Tools**: ESLint, Prettier, Turbopack for fast builds
- **Customer Management**: Live customer list (table/cards) wired to the API plus a slide-out insight panel that now includes paginated historical transactions per customer
- **Google Sheets Sync**: One-way, manual-trigger import from Google Sheets (insert-only with validation, auth-protected) for customers/orders/batches

#### DevOps & Infrastructure
- **Docker Environment**: Complete containerization for development and production
- **Database**: PostgreSQL with PostGIS in Docker
- **Object Storage**: MinIO for S3-compatible development storage
- **Caching**: Redis for session and data caching
- **Reverse Proxy**: Nginx configuration for production

### 🗂️ Project Structure

```
sales-report/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── config/         # Database and environment configuration
│   │   ├── middleware/     # Auth, error handling, rate limiting
│   │   ├── routes/         # API endpoints (auth, files)
│   │   ├── utils/          # Utilities (auth, file storage, migrations)
│   │   ├── models/         # Database models (to be implemented)
│   │   └── controllers/    # Route controllers (to be implemented)
│   ├── migrations/         # Database schema and sample data
│   ├── uploads/           # Local file storage
│   └── tests/             # Test files
├── frontend/               # Next.js web application
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities and configurations
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript type definitions
├── docs/                   # Documentation
├── scripts/               # Utility scripts
├── docker-compose.yml     # Development environment
├── docker-compose.prod.yml # Production environment
└── README.md              # This file
```

### 🏗️ Database Schema

Complete relational schema with PostGIS support:

- **Users**: Authentication and role management
- **Customers**: Contact info, credentials, geolocation data
- **Orders**: Sales tracking with shipment and quality status
- **BroodstockBatch**: Inventory management
- **Invoices**: Payment tracking
- **AuditLogs**: Complete change tracking for compliance

### 🔐 Authentication & Authorization

- **JWT Tokens**: Access and refresh token system
- **Role-Based Access**: viewer, editor, manager, admin roles
- **Password Security**: bcrypt hashing with configurable rounds
- **Rate Limiting**: Protection against brute force attacks

### 📁 File Management

- **Flexible Storage**: Local filesystem or S3-compatible storage
- **Security**: File type validation, size limits, virus scanning ready
- **Organization**: Separate handling for credentials, documents, photos
- **Access Control**: Role-based file access permissions

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL with PostGIS (if running locally)

### Quick Start with Docker

1. **Clone and start the development environment:**
   ```bash
   git clone <repository>
   cd sales-report
   docker-compose up -d
   ```

2. **Access the services:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432
   - MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)
   - Redis: localhost:6379

3. **Run database migrations:**
   ```bash
   docker-compose exec backend npm run migrate:run
   ```

### Local Development

1. **Backend setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run migrate:run
   npm run dev
   ```

2. **Frontend setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### API Documentation

#### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user profile
- `PUT /api/v1/auth/profile` - Update user profile

#### File Management Endpoints
- `POST /api/v1/files/upload/documents` - Upload general documents
- `POST /api/v1/files/upload/credentials` - Upload customer credentials
- `POST /api/v1/files/upload/photos` - Upload product photos
- `GET /api/v1/files/:filename` - Download file
- `DELETE /api/v1/files/:filename` - Delete file (manager/admin only)

#### Health Check
- `GET /health` - Server health status

### Scripts

#### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run migrate:run  # Run database migrations
npm run migrate:status # Check migration status
```

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=broodstock_sales
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# File Storage
STORAGE_TYPE=local  # or 's3'
S3_BUCKET=broodstock-files
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## ✅ Phase 2 Complete: Core Data Models & API

### 🚀 What's Been Implemented

#### Complete Customer Management
- **CRUD Operations**: Create, read, update, delete customers with validation
- **Geospatial Features**: Customer location tracking with PostGIS integration
- **Credential Management**: File uploads and expiry tracking for compliance
- **Advanced Search**: Filter by status, location, credentials, and text search
- **Duplicate Detection**: Prevent duplicate customer creation
- **Export Capabilities**: CSV export with audit trails

#### Comprehensive Order Management  
- **Full Order Lifecycle**: From creation to delivery with status tracking
- **Automatic Calculations**: Unit price × quantity with business rule validation
- **Broodstock Integration**: Link orders to inventory batches with quantity tracking
- **Bulk Operations**: Update multiple orders simultaneously
- **Advanced Analytics**: Revenue by month, top species, order statistics
- **Quality Tracking**: Monitor shipment quality and mortality reports

#### Broodstock Batch Tracking
- **Inventory Management**: Track available quantities with automatic updates
- **Batch Details**: Hatchery origin, grade, species, health status
- **Utilization Analytics**: Track usage rates and low stock alerts
- **Quarantine Tracking**: Monitor quarantine status and progression

#### Geocoding & Location Services
- **Address Geocoding**: Convert addresses to coordinates using OpenStreetMap
- **Reverse Geocoding**: Get addresses from coordinates
- **Distance Calculations**: Haversine formula for accurate distances
- **Batch Processing**: Handle multiple addresses with rate limiting
- **Validation**: Coordinate validation and suggestions

#### Advanced Business Logic
- **Order Calculations**: Taxes, discounts, shipping costs by country
- **Customer Tiers**: Automatic tier assignment based on purchase history
- **Pricing Rules**: Volume discounts and customer-specific pricing
- **Rule Validation**: Business rule enforcement for order creation
- **Currency Conversion**: Multi-currency support with exchange rates

#### Enhanced Database Schema
- **Complete Audit Trail**: Track all changes with user attribution
- **Optimized Indexes**: Fast queries for geospatial and text search
- **Data Integrity**: Foreign key constraints and validation rules
- **Sample Data**: Realistic test data for all entities

### 📊 API Endpoints Summary

#### Authentication (6 endpoints)
- User registration, login, token refresh, profile management

#### Customers (12 endpoints)
- CRUD operations, search, nearby customers, stats, CSV export

#### Orders (15 endpoints)
- CRUD operations, bulk updates, statistics, revenue analytics, duplication

#### Broodstock Batches (13 endpoints)
- CRUD operations, inventory tracking, low stock alerts, species lists

#### Files (8 endpoints)
- Multi-type uploads, downloads, signed URLs, storage management

#### Geocoding (7 endpoints)
- Address geocoding, reverse geocoding, distance calculation, validation

#### Business Logic (11 endpoints)
- Order calculations, pricing recommendations, tax/shipping computation

**Total: 72 API endpoints** with comprehensive documentation

## 🎯 Next Steps (Phase 3)

1. **Executive Dashboard Frontend**
   - KPI cards implementation
   - Sales charts and analytics
   - Real-time data updates

2. **Interactive Map Interface**
   - Customer location visualization
   - Clustering and filtering
   - Geospatial search capabilities

3. **Orders Management UI**
   - Order table with advanced filtering
   - Order creation and editing forms
   - Bulk operations interface

## 🏗️ Architecture Decisions

### Backend Technologies
- **Node.js + Express**: Fast, scalable API development
- **TypeScript**: Type safety and better developer experience
- **PostgreSQL + PostGIS**: Robust relational database with geospatial support
- **JWT Authentication**: Stateless, scalable authentication
- **Zod Validation**: Runtime type checking and validation

### Frontend Technologies
- **Next.js 14**: Full-stack React framework with app router
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Server state management
- **MapLibre GL**: Open-source mapping solution
- **Recharts**: Composable charting library

### Development Principles
- **Type Safety**: TypeScript throughout the stack
- **Security First**: Input validation, rate limiting, secure defaults
- **Audit Trail**: Complete change tracking for compliance
- **Scalability**: Designed for horizontal scaling
- **Developer Experience**: Hot reloading, linting, formatting

## 📋 Development Checklist

### Phase 1: Foundation & Setup ✅
- [x] Project structure and directories
- [x] Backend Node.js/Express with TypeScript
- [x] Frontend Next.js with TypeScript
- [x] Database configuration and migrations
- [x] Authentication and authorization system
- [x] File storage integration
- [x] Development tooling (ESLint, Prettier)
- [x] Docker development environment
- [x] API documentation and health checks

### Phase 2: Core Data Models & API ✅
- [x] Customer model and validation schemas
- [x] Customer CRUD API endpoints with advanced features
- [x] Order model and validation schemas
- [x] Order CRUD API endpoints with business logic
- [x] BroodstockBatch model and inventory management
- [x] Geocoding service for customer addresses
- [x] Business logic for order calculations
- [x] Enhanced database migrations and sample data
- [x] Comprehensive API documentation (72 endpoints)

**Status**: Backend API complete! Ready for Phase 3 frontend implementation.

## 🤝 Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Write tests for new features
3. Update documentation for API changes
4. Use conventional commit messages
5. Create feature branches for new development

## 📄 License

[Add your license here]
