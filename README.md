# Smart Mart : Retail Management System

A scalable retail management platform that integrates point-of-sale operations, inventory control, procurement, HR management, and analytics into a unified platform. This system demonstrates strong integration between operational workflows and analytics, making it suitable for real-world retail business environments.

## Modules

### POS & Customer
Manages sales transactions, invoice generation, payment processing, refunds, and customer records including purchase history and feedback.

### HR Management
Handles employee management, attendance tracking, leave requests, and payroll processing.

### Inventory Management
Maintains products, categories, brands, and batch-level stock tracking with inventory monitoring.

### Procurement
Manages suppliers, purchase orders, goods receipt, and supplier payments.

### Business Intelligence
Provides dashboards and insights for sales, inventory, supplier activity, and HR metrics.

### Administration
Implements role-based access control, system configuration, and audit logging.

## Architecture

The system follows a **microservices architecture**, where each service manages its own database and communicates through APIs.

Core services include:
- POS Service
- HR Service
- Inventory Service
- Procurement Service
- Admin Service
- Analytics Service

## Tech Stack

**Backend**
- Node.js
- Express
- TypeScript

**Frontend**
- React

**Database**
- PostgreSQL
- Prisma ORM

**Infrastructure**
- Docker
- Redis

**Cloud**
- AWS EC2
