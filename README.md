# Warehouse Microservice

Centralized warehouse and stock management with real-time updates via RabbitMQ.

## Overview

The Warehouse Microservice tracks stock levels across all warehouses and publishes real-time events when stock changes. All sales channels subscribe to these events to maintain accurate stock displays.

## Port Configuration

**Port Range**: 32xx (Central e-commerce microservices)

| Service | Subdomain | Port |
|---------|-----------|------|
| warehouse-microservice | warehouse.statex.cz | 3201 |

## Features

- Track stock across multiple warehouses (own and supplier dropship)
- Reserve stock for pending orders
- Record all stock movements (in/out/transfer/adjustment)
- Publish real-time stock events via RabbitMQ:
  - `stock.updated` - When stock changes
  - `stock.low` - When stock falls below threshold
  - `stock.out` - When stock reaches zero

## API Endpoints

Base URL: `https://warehouse.statex.cz/api` (or `http://localhost:3201/api` in dev)

### Stock

- `GET /api/stock/:productId` - Get stock across all warehouses
- `GET /api/stock/:productId/total` - Get total available stock
- `POST /api/stock/set` - Set stock quantity (absolute)
- `POST /api/stock/increment` - Add to stock
- `POST /api/stock/decrement` - Remove from stock
- `POST /api/stock/reserve` - Reserve for order
- `POST /api/stock/unreserve` - Release reservation

### Warehouses

- `GET /api/warehouses` - List warehouses
- `GET /api/warehouses/:id` - Get warehouse
- `POST /api/warehouses` - Create warehouse
- `PUT /api/warehouses/:id` - Update warehouse
- `DELETE /api/warehouses/:id` - Deactivate warehouse

### Movements

- `GET /api/movements/product/:productId` - Movement history for product
- `GET /api/movements/warehouse/:warehouseId` - Movement history for warehouse

### Reservations

- `GET /api/reservations` - Active reservations
- `GET /api/reservations/order/:orderId` - Reservations for order
- `GET /api/reservations/product/:productId` - Reservations for product

### Health

- `GET /api/health` - Health check
- `GET /api/ready` - Readiness check

## RabbitMQ Events

The service publishes events to the `stock.events` exchange with topic routing:

### stock.updated

```json
{
  "type": "stock.updated",
  "productId": "uuid",
  "warehouseId": "uuid",
  "quantity": 100,
  "available": 95,
  "timestamp": "2024-12-20T10:00:00.000Z"
}
```

### stock.low

```json
{
  "type": "stock.low",
  "productId": "uuid",
  "warehouseId": "uuid",
  "available": 3,
  "threshold": 5,
  "timestamp": "2024-12-20T10:00:00.000Z"
}
```

### stock.out

```json
{
  "type": "stock.out",
  "productId": "uuid",
  "warehouseId": "uuid",
  "timestamp": "2024-12-20T10:00:00.000Z"
}
```

## Setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (via shared database-server)
- RabbitMQ (via statex-infrastructure)

### Installation

1. Clone the repository:

```bash
git clone git@github.com:speakASAP/warehouse-microservice.git
cd warehouse-microservice
```

2. Copy `.env.example` to `.env` and configure

3. Install dependencies:

```bash
npm install
```

4. Run in development:

```bash
npm run start:dev
```

### Docker Deployment

```bash
docker compose -f docker-compose.blue.yml up -d
```

## Database Schema

### Main Tables

- `warehouses` - Own warehouses, supplier dropship locations
- `stock` - Product + warehouse + quantity + reserved
- `stock_movements` - In/out/transfer history
- `stock_reservations` - Reserved for pending orders

## Related Services

- `catalog-microservice` (3200) - Product catalog
- `suppliers-microservice` (3202) - Supplier API integration
- `orders-microservice` (3203) - Order processing
- `allegro-service` (34xx) - Allegro sales channel (subscribes to stock events)
- `flipflop-service` (35xx) - FlipFlop website (subscribes to stock events)

