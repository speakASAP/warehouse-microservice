# Statex Microservices Ecosystem

A unified microservices architecture for building scalable, reusable applications.

---

## 🎯 Vision

Create a technological ecosystem where multiple microservices are available on the production server, accessible via SSH or HTTPS. These microservices can be cross-used by each other and by multiple applications, enabling a single codebase approach for maximum code reuse and efficiency.

---

## 📊 Summary

### Application list

|     Application     | Authentication | Database |  Logging  |   Nginx   | Notifications |  Payment  |
| ------------------- | -------------- | -------- | --------- | --------- | ------------- | --------- |
| **allegro-service** |   ✅ Shared    | ✅ Shared | ✅ Shared | ✅ Shared |    ✅ Shared   | ✅ Shared |
| **crypto-ai-agent** |   ✅ Shared    | ✅ Shared | ✅ Shared | ✅ Shared |    ✅ Shared   | ✅ Shared |
| **flipflop-service**|   ✅ Shared    | ✅ Shared | ✅ Shared | ✅ Shared |    ✅ Shared   | ✅ Shared |
| **marathon**        |   ✅ Shared    | ✅ Shared | ✅ Shared | ✅ Shared |    ✅ Shared   | ✅ Shared |
| **shop-assistant**  |   ✅ Shared    | ✅ Shared | ✅ Shared | ✅ Shared |               |           |
| **statex**          |   ✅ Shared    | ✅ Shared | ✅ Shared | ✅ Shared |    ✅ Shared   | ✅ Shared |

### Microserices list

|    Microservice     | Authentication | Database  |  Logging  |   Nginx   | Notifications |  Payment  |
| ------------------- | -------------- | --------- | --------- | --------- | ------------- | --------- |
| **AI**              |                | ✅ Shared | ✅ Shared |           |               |           |
| **auth**            |                | ✅ Shared | ✅ Shared |           |               |           |
| **database**        |                |           | ✅ Shared |           |               |           |
| **logging**         |                |           |           |           |               |           |
| **nginx**           |                |           | ✅ Shared |           |               |           |
| **notifications**   |                | ✅ Shared | ✅ Shared |           |               |           |
| **payment**         |                | ✅ Shared | ✅ Shared |           |   ✅ Shared   |           |

## 🏗️ Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                   Production Server                         │
│                  (statex server)                            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐  ┌────────▼────────┐   ┌───────▼──────┐
│  Application │  │  Application    │   │  Application │
│  (flipflop)  │  │  (statex.cz)    │   │  (crypto-ai) │
└───────┬──────┘  └─────────┬───────┘   └───────┬──────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐  ┌────────▼────────┐  ┌───────▼──────┐
│   Shared     │  │   Shared        │  │   Shared     │
│ Microservice │  │ Microservice    │  │ Microservice │
└──────────────┘  └─────────────────┘  └──────────────┘
```

---

## 📦 Available Microservices

### Core Infrastructure Services

#### 1. **nginx-microservice**

- **Purpose**: Reverse proxy, SSL termination, and blue/green deployment management
- **Access**:
  - Production: Managed via nginx-microservice container
  - Configuration: `/home/statex/nginx-microservice`
- **Features**:
  - Automatic SSL certificate management (Let's Encrypt/Certbot)
  - Blue/green deployment orchestration
  - Load balancing and routing
  - Used by: All applications (statex.cz, flipflop.statex.cz, crypto-ai-agent.statex.cz, etc.)

#### 2. **database-server**

- **Purpose**: Shared PostgreSQL and Redis database server
- **Access**:
  - Docker Network: `db-server-postgres:${DB_SERVER_PORT:-5432}`, `db-server-redis:${REDIS_SERVER_PORT:-6379}` (ports configured in database-server/.env)
  - SSH Tunnel (local dev): `localhost:${DB_SERVER_PORT:-5432}`, `localhost:${REDIS_SERVER_PORT:-6379}` (ports configured in database-server/.env)
- **Features**:
  - Centralized database management
  - Multiple databases (one per application)
  - Shared Redis cache
  - Used by: All applications requiring database storage

#### 3. **notifications-microservice**

- **Purpose**: Multi-channel notification service
- **Access**:
  - Production URL: `https://notifications.statex.cz`
  - Docker Network: `http://notifications-microservice:${PORT:-3368}` (port configured in notifications-microservice/.env)
- **Features**:
  - Email notifications (SendGrid)
  - Telegram notifications
  - WhatsApp notifications
  - SMS notifications (future)
  - Template management
  - Used by: flipflop, statex.cz, and other applications

#### 4. **logging-microservice**

- **Purpose**: Centralized logging service
- **Access**:
  - Production URL: `https://logging.statex.cz`
  - Docker Network: `http://logging-microservice:${PORT:-3367}` (port configured in logging-microservice/.env)
- **Features**:
  - Centralized log collection
  - Log querying and filtering
  - Service-based log tracking
  - Used by: All applications and microservices

#### 5. **payments-microservice**

- **Purpose**: Centralized payment processing service
- **Access**:
  - Production URL: `https://payments.statex.cz`
  - Docker Network: `http://payments-microservice:${SERVICE_PORT:-3468}` (port configured in payments-microservice/.env)
- **Features**:
  - Multiple payment methods (PayPal, Stripe, PayU, Fio Banka, ComGate)
  - Unified payment API
  - Webhook support for payment status updates
  - Refund processing (full and partial)
  - Payment transaction history
  - Secure API key authentication
  - Used by: flipflop, statex, crypto-ai-agent, and other applications requiring payment processing

#### 6. **auth-microservice**

- **Purpose**: Centralized authentication and login service
- **Access**:
  - Production URL: `https://auth.statex.cz`
  - Docker Network: `http://auth-microservice:${PORT:-3370}` (port configured in auth-microservice/.env)
- **Features**:
  - User registration and login (email/password)
  - Contact-based registration (email/phone without password)
  - JWT token generation and validation
  - Token refresh mechanism
  - User session management
  - Password reset and recovery (with email notifications)
  - Password change for authenticated users
  - User profile management
  - bcrypt password hashing
  - Secure API authentication
  - Used by: flipflop, statex, crypto-ai-agent, and other applications requiring authentication

#### 7. **ai-microservice**

- **Purpose**: Centralized AI processing service for business automation
- **Access**:
  - Production URL: `https://ai.statex.cz`
  - Docker Network: `http://ai-microservice:${AI_ORCHESTRATOR_PORT:-3380}` (port configured in ai-microservice/.env)
- **Features**:
  - AI Orchestrator - Central coordination for all AI operations
  - NLP Service - Text analysis and business plan generation
  - ASR Service - Speech-to-text conversion
  - Document AI - File analysis and OCR
  - Prototype Generator - Website and application prototype creation
  - Template Repository - Template management
  - Free AI Service - Free AI models integration
  - AI Workers - Background AI processing
  - Gemini AI Service - Google Gemini AI integration
  - Data Viz Service - Data visualization
  - All AI agents data stored in shared database
  - All logging sent to centralized logging microservice
  - Used by: statex application for AI-powered business automation

#### 8. **warehouse-microservice**

- **Purpose**: Centralized warehouse and stock management with real-time updates
- **Access**:
  - Production URL: `https://warehouse.statex.cz`
  - Docker Network: `http://warehouse-microservice:${PORT:-3201}` (port configured in warehouse-microservice/.env)
- **Features**:
  - Track stock across multiple warehouses (own and supplier dropship)
  - Reserve stock for pending orders
  - Record all stock movements (in/out/transfer/adjustment)
  - Publish real-time stock events via RabbitMQ
  - Stock level tracking and management
  - Used by: flipflop-service, allegro-service, and other e-commerce applications

#### 9. **catalog-microservice**

- **Purpose**: Single source of truth for all product data across the e-commerce platform
- **Access**:
  - Production URL: `https://catalog.statex.cz`
  - Docker Network: `http://catalog-microservice:${PORT:-3200}` (port configured in catalog-microservice/.env)
- **Features**:
  - Centralized product management (SKU, title, description, brand, EAN, dimensions)
  - Category management (hierarchical tree)
  - Attribute management (text, number, select types)
  - Media management (images, videos, documents)
  - Pricing management (base price, cost price, margin, sale prices)
  - Used by: flipflop-service, allegro-service, and other e-commerce applications

#### 10. **suppliers-microservice**

- **Purpose**: Supplier API integration and product import service
- **Access**:
  - Production URL: `https://supplier.statex.cz`
  - Docker Network: `http://suppliers-microservice:${PORT:-3202}` (port configured in suppliers-microservice/.env)
- **Features**:
  - Connect to supplier REST/XML/CSV APIs
  - Scheduled automatic imports
  - Category mapping (supplier → catalog)
  - Import job tracking
  - Used by: flipflop-service, allegro-service for supplier product imports

#### 11. **orders-microservice**

- **Purpose**: Central order processing service for all sales channels
- **Access**:
  - Production URL: `https://orders.statex.cz`
  - Docker Network: `http://orders-microservice:${PORT:-3203}` (port configured in orders-microservice/.env)
- **Features**:
  - Centralized order processing from all sales channels
  - Order status management
  - Shipment tracking
  - Fulfillment management
  - Publish order events via RabbitMQ (order.created, order.updated, order.shipped)
  - Used by: flipflop-service, allegro-service, and other sales channel services

---

## 📊 Current Usage Status

### Quick Summary

**Key Findings:**

- ✅ **Database**: All applications use shared `database-server`
- ✅ **Notifications**: All applications use shared `notifications-microservice`
- ✅ **Logging**: All applications use shared `logging-microservice`
- ✅ **Payments**: All applications use shared `payments-microservice`
- ✅ **Authentication**: All applications use shared `auth-microservice`
- ✅ **AI Services**: statex application uses shared `ai-microservice`

---

## 📱 Applications

### 1. **flipflop-service** (flipflop.statex.cz)

- **Purpose**: FlipFlop.cz e-commerce website service for selling diverse product categories
- **Technology**: NestJS (TypeScript), PostgreSQL, Redis
- **Location**: `/home/statex/flipflop-service`
- **Documentation**: See `flipflop-service/README.md`
- **Uses**: All shared microservices (database, notifications, logging, payments, auth)

### 2. **crypto-ai-agent** (crypto-ai-agent.statex.cz)

- **Purpose**: AI-powered cryptocurrency trading and portfolio management platform
- **Technology**: Python (FastAPI), PostgreSQL, Redis
- **Location**: `/home/statex/crypto-ai-agent`
- **Documentation**: See `crypto-ai-agent/README.md`
- **Uses**: All shared microservices (database, notifications, logging, payments, auth)

### 3. **statex** (statex.cz)

- **Purpose**: AI-powered business automation platform
- **Technology**: Python (FastAPI), Next.js, PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch
- **Location**: `/home/statex/statex`
- **Documentation**: See `statex/README.md`
- **Uses**: All shared microservices (database, notifications, logging, payments, auth, ai)
- **Sub-services**: Multiple internal microservices (platform services, website services)

### 4. **allegro-service** (allegro.statex.cz)

- **Purpose**: Sales channel service for Allegro.cz/pl marketplaces - multi-account offer management
- **Technology**: NestJS (TypeScript), PostgreSQL
- **Location**: `/home/statex/allegro-service`
- **Documentation**: See `allegro-service/README.md`
- **Uses**: All shared microservices (database, notifications, logging, payments, auth)
- **Features**:
  - Importing existing Allegro offers
  - Importing products from BizBox CSV files
  - Bidirectional synchronization between database and Allegro
  - Polling events from Allegro API
  - Scheduled sync jobs

### 5. **aukro-service** (aukro.statex.cz)

- **Purpose**: Aukro.cz marketplace integration service
- **Technology**: NestJS (TypeScript), PostgreSQL
- **Location**: `/home/statex/aukro-service`
- **Documentation**: See `aukro-service/README.md`
- **Uses**: All shared microservices (database, notifications, logging, payments, auth) and central e-commerce microservices (catalog, warehouse, orders)
- **Features**:
  - Create/update offers on Aukro from catalog products
  - Multi-account support
  - Subscribe to stock events → update Aukro stock
  - Receive Aukro orders → forward to orders-microservice

### 6. **heureka-service** (heureka.statex.cz)

- **Purpose**: Heureka.cz/sk XML feed generation service
- **Technology**: NestJS (TypeScript), PostgreSQL
- **Location**: `/home/statex/heureka-service`
- **Documentation**: See `heureka-service/README.md`
- **Uses**: All shared microservices (database, notifications, logging, payments, auth) and central e-commerce microservices (catalog, warehouse)
- **Features**:
  - Generate Heureka XML feed from catalog products
  - Subscribe to stock events → regenerate feed
  - Support multiple feed types (Heureka.cz, Heureka.sk)
  - Store feed generation history

### 7. **bazos-service** (bazos.statex.cz)

- **Purpose**: Bazos.cz classifieds automation service
- **Technology**: NestJS (TypeScript), PostgreSQL
- **Location**: `/home/statex/bazos-service`
- **Documentation**: See `bazos-service/README.md`
- **Uses**: All shared microservices (database, notifications, logging, payments, auth) and central e-commerce microservices (catalog, warehouse, orders)
- **Features**:
  - Automate Bazos classified ad creation/updates
  - Subscribe to stock events → update ads
  - Manage multiple Bazos accounts
  - Handle ad renewal/expiration

### 8. **messenger** (messenger.statex.cz)

- **Purpose**: Self-hosted Matrix messaging service with Synapse homeserver, Element X client, and LiveKit SFU for A/V calls
- **Technology**: Synapse (Matrix), PostgreSQL, Redis, LiveKit, Element X
- **Location**: `/home/statex/messenger`
- **Documentation**: See `messenger/README.md`
- **Features**:
  - Synapse Matrix homeserver for messaging and federation
  - PostgreSQL database for Synapse
  - Redis cache and worker coordination
  - LiveKit SFU with built-in TURN server for A/V calls
  - Element X web client
  - Blue/green deployment support
  - Automatic SSL certificate management via nginx-microservice

### 9. **beauty** (beauty.statex.cz)

- **Purpose**: Multi-tenant event-driven IT platform for beauty franchise network
- **Technology**: Domain-Driven Design (DDD), Event-Driven Architecture, PostgreSQL, NATS/Kafka
- **Location**: `/home/statex/beauty`
- **Documentation**: See `beauty/README.md`
- **Uses**: All shared microservices (database, notifications, logging, payments, auth)
- **Features**:
  - Multi-tenant platform for beauty salon franchise network
  - POS (services and product sales)
  - CRM (clients, history, GDPR consents)
  - Booking (online and offline scheduling)
  - Inventory/Warehouse management
  - Basic ERP logic
  - Reporting/BI
  - Public website + online booking
  - Event-driven architecture with tenant isolation

### 10. **marathon** (marathon.statex.cz)

- **Purpose**: Standalone marathon product for intensive learning programs
- **Technology**: NestJS (TypeScript), PostgreSQL, Redis
- **Location**: `/home/statex/marathon`
- **Repository**: `git@github.com:speakASAP/marathon.git`
- **Uses**: All shared microservices (database, notifications, logging, payments, auth)
- **Notes**: Production-only deployment with blue/green via nginx-microservice

### 11. **shop-assistant** (shop-assistant.statex.cz)

- **Purpose**: AI shopping assistant ("Я хочу") – voice/text search, iterative refinement, best price across the web, redirect to merchant
- **Technology**: NestJS (TypeScript), PostgreSQL, Prisma
- **Location**: `/home/statex/shop-assistant`
- **Documentation**: See `shop-assistant/README.md`
- **Uses**: Shared microservices (database, logging, auth), ai-microservice (ASR, LLM), external search API (e.g. Serper)
- **Port range**: 45xx (4500 blue, 4501 green)
- **Notes**: Blue/green deployment via nginx-microservice; search is global (internet), not internal catalog

---

## 🔌 How Applications Use Microservices

### Standard Integration Pattern

### 1. **Environment Configuration**

All microservices are configured via environment variables in `.env`:

```bash
# Database (Shared)
# Configured in database-server/.env: DB_SERVER_PORT (default: 5432)
DB_HOST=db-server-postgres  # Docker network
# or
DB_HOST=localhost  # SSH tunnel for local dev
DB_PORT=${DB_SERVER_PORT:-5432}  # From database-server/.env
DB_USER=dbadmin
DB_PASSWORD=<password>
DB_NAME=<application-database-name>

# Redis (Shared)
# Configured in database-server/.env: REDIS_SERVER_PORT (default: 6379)
REDIS_HOST=db-server-redis  # Docker network
# or
REDIS_HOST=localhost  # SSH tunnel for local dev
REDIS_PORT=${REDIS_SERVER_PORT:-6379}  # From database-server/.env

# Notifications (Shared)
# Configured in notifications-microservice/.env: PORT (default: 3368)
NOTIFICATION_SERVICE_URL=https://notifications.statex.cz  # Production
# or
NOTIFICATION_SERVICE_URL=http://notifications-microservice:${PORT:-3368}  # Docker network

# Logging (Shared)
# Configured in logging-microservice/.env: PORT (default: 3367)
LOGGING_SERVICE_URL=https://logging.statex.cz  # Production
# or
LOGGING_SERVICE_URL=http://logging-microservice:${PORT:-3367}  # Docker network

# Payments (Shared)
# Configured in payments-microservice/.env: SERVICE_PORT (default: 3468), PORT_BLUE/PORT_GREEN (default: 3369)
PAYMENT_SERVICE_URL=https://payments.statex.cz  # Production
# or
PAYMENT_SERVICE_URL=http://payments-microservice:${SERVICE_PORT:-3468}  # Docker network
PAYMENT_API_KEY=<your-api-key>

# Authentication (Shared)
# Configured in auth-microservice/.env: PORT (default: 3370)
AUTH_SERVICE_URL=https://auth.statex.cz  # Production
# or
AUTH_SERVICE_URL=http://auth-microservice:${PORT:-3370}  # Docker network

# JWT Configuration (Shared - must match auth-microservice JWT_SECRET)
# Copy JWT_SECRET from auth-microservice/.env to enable fast local token validation
JWT_SECRET=<copy-from-auth-microservice/.env>  # Must match auth-microservice JWT_SECRET

# AI Services (Shared)
# Configured in ai-microservice/.env: AI_ORCHESTRATOR_PORT (default: 3380)
AI_SERVICE_URL=https://ai.statex.cz  # Production
# or
AI_SERVICE_URL=http://ai-microservice:${AI_ORCHESTRATOR_PORT:-3380}  # Docker network
```

### 2. **Code Integration**

Applications use shared service clients/wrappers:

```typescript
// Example: Using Notification Service
import { NotificationService } from '@shared/notifications/notification.service';

@Injectable()
export class OrderService {
  constructor(private notificationService: NotificationService) {}

  async createOrder(order: Order) {
    // ... create order logic
    
    // Use shared notification service
    await this.notificationService.sendOrderConfirmation(
      order.userEmail,
      order.orderNumber,
      order.total
    );
  }
}
```

```typescript
// Example: Using Logging Service
import { LoggerService } from '@shared/logger/logger.service';

@Injectable()
export class ProductService {
  constructor(private logger: LoggerService) {}

  async getProduct(id: string) {
    this.logger.log('Fetching product', { productId: id });
    // ... fetch logic
  }
}
```

### 3. **Network Configuration**

All services connect to the shared Docker network:

```yaml
# docker-compose.yml
networks:
  nginx-network:
    external: true
    name: nginx-network
```

---

## 🌐 Access Methods

### Production Access (HTTPS)

```bash
# Notifications
curl https://notifications.statex.cz/health

# Logging
curl https://logging.statex.cz/health

# Payments
curl https://payments.statex.cz/health

# Authentication
curl https://auth.statex.cz/health

# Database (via SSH tunnel)
# Port configured in database-server/.env: DB_SERVER_PORT (default: 5432)
ssh -L ${DB_SERVER_PORT:-5432}:localhost:${DB_SERVER_PORT:-5432} statex
psql -h localhost -p ${DB_SERVER_PORT:-5432} -U dbadmin -d <database>
```

### Docker Network Access

```bash
# From within a container on nginx-network
# Ports configured in respective .env files
curl http://notifications-microservice:${PORT:-3368}/health  # notifications-microservice/.env
curl http://logging-microservice:${PORT:-3367}/health  # logging-microservice/.env
curl http://payments-microservice:${SERVICE_PORT:-3468}/health  # payments-microservice/.env
curl http://auth-microservice:${PORT:-3370}/health  # auth-microservice/.env
psql -h db-server-postgres -p ${DB_SERVER_PORT:-5432} -U dbadmin -d <database>  # database-server/.env
```

### SSH Access

```bash
# Connect to production server
ssh statex

# Access microservice directories
cd /home/statex/nginx-microservice
cd /home/statex/database-server
cd /home/statex/notifications-microservice
cd /home/statex/logging-microservice
cd /home/statex/payments-microservice
cd /home/statex/auth-microservice
cd /home/statex/ai-microservice
```

---

## 📋 Standards for Using Microservices

### 1. **Service Discovery**

- **Production**: Use HTTPS URLs (`https://<service>.statex.cz`)
- **Docker Network**: Use service names (`http://<service-name>:<port>`)
- **Local Development**: Use SSH tunnels or localhost with port forwarding

### 2. **Configuration Management**

- ✅ **DO**: Use environment variables for all service URLs
- ✅ **DO**: Provide sensible defaults (production URLs)
- ✅ **DO**: Document service URLs in `.env.example`
- ❌ **DON'T**: Hardcode service URLs in code
- ❌ **DON'T**: Assume service availability without health checks

### 3. **Error Handling**

- Implement circuit breakers for external service calls
- Use retry logic with exponential backoff
- Provide fallback mechanisms when services are unavailable
- Log all service interaction errors

### 4. **Health Checks**

- All microservices expose `/health` endpoints
- Applications should check service health before critical operations
- Implement graceful degradation when services are down

### 5. **Authentication & Security**

- Use environment variables for sensitive credentials
- Never commit `.env` files to version control
- Use HTTPS for all production service calls
- Implement proper authentication for service-to-service communication

### 6. **Environment Variables Sync (.env)**

`.env` files exist in three places: **local** (`/Users/sergiystashok/Documents/GitHub`), **statex** (`ssh statex` → `/home/statex`), **sgipreal** (`ssh sgipreal` → `/home/sgipreal`). Use the scripts in `scripts/` to compare and sync:

- **Quick overview** (which projects differ): `./scripts/env-diff-summary.sh`
- **Detailed comparison** (variable-by-variable): `./scripts/compare-env.sh` or `./scripts/compare-env.sh <project>`
- **Sync** (from local to prod, preserves domains/secrets): `./scripts/sync-env-intelligent.sh [--dry-run] [project]`
- **Menu**: `./scripts/env-sync-quick.sh`

Full documentation: [scripts/ENV_SYNC_README.md](scripts/ENV_SYNC_README.md). Config: `scripts/env-sync-config.sh` (DOMAIN_VARS, SECRET_VARS).

---

## 🔄 Cross-Service Communication

### Microservice-to-Microservice

Microservices can call each other:

```typescript
// Example: Logging microservice calling notification microservice
// (if logging service needs to alert on critical errors)

const notificationService = new NotificationService();
await notificationService.sendNotification({
  channel: 'email',
  type: 'error_alert',
  recipient: 'admin@statex.cz',
  message: 'Critical error in logging service',
});
```

### Application-to-Microservice

Applications call shared microservices:

```typescript
// Application → Notification Service
await notificationService.sendOrderConfirmation(...);

// Application → Logging Service
await logger.log('Order created', { orderId });

// Application → Database Service
await database.query('SELECT * FROM orders');
```

---

## 🚀 Adding New Microservices

### Standard Structure

1. **Create separate repository**:

   ```bash
   git clone <template-repo> <new-microservice>
   cd <new-microservice>
   ```

2. **Deploy to production server**:

   ```bash
   ssh statex
   cd /home/statex
   git clone <repo-url> <new-microservice>
   ```

3. **Connect to shared network**:

   ```yaml
   # docker-compose.yml
   networks:
     nginx-network:
       external: true
       name: nginx-network
   ```

4. **Deploy using nginx-microservice scripts** (if needs external access):

   ```bash
   cd ~/nginx-microservice
   ./scripts/blue-green/deploy-smart.sh <service-name>
   ```

   The deployment script will automatically:
   - Create/update service registry file in `nginx-microservice/service-registry/`
   - Generate nginx configuration with correct container names
   - Set up SSL certificates
   - Deploy using blue/green deployment pattern

5. **Document in this README**:
   - Add service description
   - Document access methods
   - Provide integration examples

### ⚠️ Service Registry - Important Rules

**DO NOT** create `service-registry.json` files in individual service codebases!

- Service registry files are **automatically created and managed** by the nginx-microservice deployment script
- They are stored in `nginx-microservice/service-registry/` directory
- The deployment script auto-detects service configuration from docker-compose files and environment variables
- Nginx configurations are automatically generated from service registry files

For complete documentation, see [Service Registry Documentation](./docs/SERVICE_REGISTRY.md).

### 🔒 Production-Ready Services

The following services are **production-ready** and should **NOT** be modified:

- **database-server** - Shared PostgreSQL and Redis database
- **auth-microservice** - Authentication and user management
- **nginx-microservice** - Reverse proxy and SSL management
- **logging-microservice** - Centralized logging service

#### Rules for Production-Ready Services

1. **✅ Allowed**: Use scripts from these services' directories
2. **❌ NOT Allowed**: Modify code, configuration, or infrastructure directly
3. **⚠️ Permission Required**: If you need to modify something, **ask for permission first**

#### Using Scripts

You can use scripts from production-ready services:

```bash
# Example: Use nginx-microservice scripts
cd ~/nginx-microservice
./scripts/blue-green/deploy-smart.sh <service-name>
./scripts/add-domain.sh <domain> <container> <port>
```

#### Requesting Modifications

If you need to modify a production-ready service:

1. **Document** the need for modification
2. **Explain** why the modification is necessary
3. **Request permission** before making any changes
4. **Wait for approval** before proceeding

---

## 📚 Integration Examples

### Example 1: flipflop Application

```typescript
// Uses multiple shared services
import { NotificationService } from '@shared/notifications';
import { LoggerService } from '@shared/logger';
import { DatabaseModule } from '@shared/database';

@Module({
  imports: [
    DatabaseModule,  // Uses database-server
    NotificationModule,  // Uses notifications-microservice
    LoggerModule,  // Uses logging-microservice
  ],
})
export class AppModule {}
```

### Example 2: Statex.cz Application

```typescript
// Same shared services, different application
import { NotificationService } from '@shared/notifications';
import { LoggerService } from '@shared/logger';

// Uses same microservices but different database
DB_NAME=statex_website
```

---

## 🎯 Benefits of This Architecture

1. **Code Reuse**: Single codebase for shared functionality
2. **Consistency**: All applications use the same services
3. **Maintainability**: Update once, benefit everywhere
4. **Scalability**: Services can scale independently
5. **Reliability**: Centralized monitoring and health checks
6. **Efficiency**: No duplicate infrastructure
7. **Flexibility**: Easy to add new applications

---

## 🔌 Port Configuration Reference

This section documents all ports used by applications and microservices to help identify port conflicts.

### ✅ Port Conflict Analysis Summary

**Analysis Date**: 2025-12-04

**Total Ports Analyzed**: 89 unique host ports

**Conflict Status**: ✅ **NO CONFLICTS DETECTED**

**Verification Method**:

- ✅ All `.env` files checked (10 applications/microservices)
- ✅ All `docker-compose*.yml` files analyzed (42 files)
- ✅ Host ports verified across all services
- ✅ Blue/green deployment ports verified
- ✅ Container port mappings verified

**Key Findings**:

- All applications use distinct port ranges (31xx, 32xx, 33xx, 34xx, 35xx, 36xx, 37xx, 38xx, 39xx, 40xx, 41xx, 42xx, 43xx, 44xx)
- Central e-commerce microservices use 32xx range (3200-3203)
- Shared infrastructure microservices use 33xx range (3367-3371, 3380-3389)
- Database ports (5432, 6379) are localhost-only and shared via Docker network
- Blue/green deployments use same host ports (only one active at a time)
- All port mappings follow consistent patterns per application

**Port Range Summary**:

- **31xx** (5 ports): crypto-ai-agent
- **32xx** (4 ports): Central e-commerce microservices (catalog, warehouse, suppliers, orders)
- **33xx** (10 ports): Shared infrastructure microservices (logging, notifications, payment, auth, ai)
- **34xx** (9 ports): allegro-service
- **35xx** (10 ports): flipflop-service
- **36xx** (27 ports): statex (platform, website, AI services, infrastructure)
- **37xx** (6 ports): aukro-service
- **38xx** (6 ports): heureka-service
- **39xx** (6 ports): bazos-service
- **40xx** (5 ports): messenger
- **41xx** (20 ports): beauty (4100-4119)
- **42xx** (20 ports): speakasap (4200-4219)
- **43xx** (10 ports): sgiprealestate (4300-4309)
- **44xx** (10 ports): leads-microservice (4400-4409)
- **45xx** (10 ports): shop-assistant (4500-4509)
- **Standard ports** (1 port): nginx (80, 443)

### ✅ Port Management Strategy

**Port Range Allocation:**

- **31xx**: crypto-ai-agent (3100-3104)
- **32xx**: Central e-commerce microservices (3200-3203) - catalog, warehouse, suppliers, orders
- **33xx**: Shared infrastructure microservices (3367-3371, 3380-3389) - auth, notifications, payment, logging, ai
- **34xx**: allegro-service (3402-3411)
- **35xx**: flipflop-service (3500-3511)
- **36xx**: statex (3600-3626) - platform, website, infrastructure
- **37xx**: aukro-service (3700-3705)
- **38xx**: heureka-service (3800-3805)
- **39xx**: bazos-service (3900-3905)
- **40xx**: messenger (4000-4004)
- **41xx**: beauty (4100-4119)
- **42xx**: speakasap (4200-4219)
- **43xx**: sgiprealestate (4300-4309)
- **44xx**: leads-microservice (4400-4409)
- **45xx**: shop-assistant (4500-4509)

**Port Mapping Strategy:**

1. **Host Port = Container Port** (Preferred for consistency):
   - **allegro-service**: All services use same host and container ports (e.g., `${API_GATEWAY_PORT:-3411}:${API_GATEWAY_PORT:-3411}`, `${PRODUCT_SERVICE_PORT:-3402}:${PRODUCT_SERVICE_PORT:-3402}`)
   - **crypto-ai-agent**: All services use same host and container ports (e.g., `${FRONTEND_PORT:-3100}:${FRONTEND_PORT:-3100}`, `${API_PORT:-3102}:${API_PORT:-3102}`)
   - **Shared microservices**: Most host ports match container ports (e.g., `${PORT:-3367}:${PORT:-3367}`, `${PORT:-3368}:${PORT:-3368}`, `${PORT:-3370}:${PORT:-3370}`), except payment (`${PORT_BLUE:-3369}:${SERVICE_PORT:-3468}`) and auth green (`3371:${PORT:-3370}`)

2. **Host Port ≠ Container Port** (For standard application ports):
   - **flipflop-service**: Host ports (35xx) map to standard container ports (3000, 3002-3009, 3011)
   - **statex**: Host ports (36xx) map to standard container ports (3000, 8000, 8020)
   - **payments-microservice**: Host port (3369) maps to container port (3468)

**Benefits:**

- All ports can be forwarded to host without conflicts
- Visual distinction by port range makes it easy to identify which application a service belongs to
- Reduces errors when configuring services
- Container ports can remain standard (3000, 8000, etc.) for compatibility while host ports provide unique identification

### Shared Infrastructure Services Ports

**Note**: All ports are configured in respective `.env` files. The values shown are defaults. See each microservice's `.env` file for actual configuration.

| Service | Host Port | Container Port | .env Variable | Description | Access Method |
| ------- | --------- | -------------- | ------------- | ----------- | ------------- |
| **nginx-microservice** | 80, 443 | 80, 443 | N/A (standard ports) | HTTP/HTTPS reverse proxy | External (production) |
| **database-server** (PostgreSQL) | `${DB_SERVER_PORT}` | `${DB_SERVER_PORT}` | `DB_SERVER_PORT` (database-server/.env) | Shared PostgreSQL database | Docker: `db-server-postgres:${DB_SERVER_PORT}`, SSH: `localhost:${DB_SERVER_PORT}` |
| **database-server** (Redis) | `${REDIS_SERVER_PORT}` | `${REDIS_SERVER_PORT}` | `REDIS_SERVER_PORT` (database-server/.env) | Shared Redis cache | Docker: `db-server-redis:${REDIS_SERVER_PORT}`, SSH: `localhost:${REDIS_SERVER_PORT}` |
| **auth-microservice** (Blue) | `${PORT}` | `${PORT}` | `PORT` (auth-microservice/.env) | Authentication service (blue deployment) | Docker: `auth-microservice:${PORT}`, Production: `https://auth.statex.cz` |
| **auth-microservice** (Green) | 3371 | `${PORT}` | `PORT` (auth-microservice/.env) | Authentication service (green deployment) | Docker: `auth-microservice:${PORT}`, Production: `https://auth.statex.cz` |
| **notifications-microservice** | `${PORT}` | `${PORT}` | `PORT` (notifications-microservice/.env) | Notification service | Docker: `notifications-microservice:${PORT}`, Production: `https://notifications.statex.cz` |
| **logging-microservice** | `${PORT}` | `${PORT}` | `PORT` (logging-microservice/.env) | Logging service | Docker: `logging-microservice:${PORT}`, Production: `https://logging.statex.cz` |
| **payments-microservice** (Blue) | `${PORT_BLUE}` | `${SERVICE_PORT}` | `PORT_BLUE`, `SERVICE_PORT` (payments-microservice/.env) | Payment processing service (blue deployment) | Docker: `payments-microservice:${SERVICE_PORT}`, Production: `https://payments.statex.cz` |
| **payments-microservice** (Green) | `${PORT_GREEN}` | `${SERVICE_PORT}` | `PORT_GREEN`, `SERVICE_PORT` (payments-microservice/.env) | Payment processing service (green deployment) | Docker: `payments-microservice:${SERVICE_PORT}`, Production: `https://payments.statex.cz` |

### Central E-commerce Microservices Ports (32xx Range)

**Note**: All ports configured in respective `.env` files. Values shown are defaults. These microservices serve as the single source of truth for all e-commerce operations.

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **Catalog Microservice** | `${PORT:-3200}` | `${PORT:-3200}` | `PORT` (catalog-microservice/.env) | Centralized product catalog management |
| **Warehouse Microservice** | `${PORT:-3201}` | `${PORT:-3201}` | `PORT` (warehouse-microservice/.env) | Centralized warehouse and stock management |
| **Suppliers Microservice** | `${PORT:-3202}` | `${PORT:-3202}` | `PORT` (suppliers-microservice/.env) | Supplier API integration |
| **Orders Microservice** | `${PORT:-3203}` | `${PORT:-3203}` | `PORT` (orders-microservice/.env) | Centralized order processing |

### flipflop-service Application Ports (35xx Range)

**Note**: All ports configured in `flipflop-service/.env`. Values shown are defaults.

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **Frontend** | `${FRONTEND_PORT}` | 3000 | `FRONTEND_PORT` | Next.js frontend application |
| **API Gateway** | `${API_GATEWAY_PORT}` | 3011 | `API_GATEWAY_PORT` | Main API gateway for routing |
| **Product Service** | `${PRODUCT_SERVICE_PORT}` | 3002 | `PRODUCT_SERVICE_PORT` | Product catalog management |
| **Order Service** | `${ORDER_SERVICE_PORT}` | 3003 | `ORDER_SERVICE_PORT` | Order processing |
| **User Service** | `${USER_SERVICE_PORT}` | 3004 | `USER_SERVICE_PORT` | User management |
| **Warehouse Service** | `${WAREHOUSE_SERVICE_PORT}` | 3005 | `WAREHOUSE_SERVICE_PORT` | Warehouse management |
| **Supplier Service** | `${SUPPLIER_SERVICE_PORT}` | 3006 | `SUPPLIER_SERVICE_PORT` | Supplier integration |
| **AI Service** | `${AI_SERVICE_PORT}` | 3007 | `AI_SERVICE_PORT` | AI shopping assistant |
| **Analytics Service** | `${ANALYTICS_SERVICE_PORT}` | 3008 | `ANALYTICS_SERVICE_PORT` | Analytics and reporting |
| **Cart Service** | `${CART_SERVICE_PORT}` | 3009 | `CART_SERVICE_PORT` | Shopping cart management |

### Aukro Application Ports (37xx Range)

**Note**: All ports configured in `aukro-service/.env`. Values shown are defaults.

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **Aukro Service** | `${AUKRO_SERVICE_PORT:-3700}` | 3700 | `AUKRO_SERVICE_PORT` | Aukro marketplace integration |
| **API Gateway** | `${API_GATEWAY_PORT:-3701}` | 3701 | `API_GATEWAY_PORT` | Request routing and authentication |
| **Import Service** | `${IMPORT_SERVICE_PORT:-3702}` | 3702 | `IMPORT_SERVICE_PORT` | CSV import and transformation |
| **Settings Service** | `${AUKRO_SETTINGS_SERVICE_PORT:-3703}` | 3703 | `AUKRO_SETTINGS_SERVICE_PORT` | User settings and API key management |
| **Gateway Proxy** | `${GATEWAY_PROXY_PORT:-3704}` | 80 | `GATEWAY_PROXY_PORT` | Nginx gateway proxy |
| **Frontend Service** | `${AUKRO_FRONTEND_SERVICE_PORT:-3705}` | 3705 | `AUKRO_FRONTEND_SERVICE_PORT` | Web interface for users |

### Heureka Application Ports (38xx Range)

**Note**: All ports configured in `heureka-service/.env`. Values shown are defaults.

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **Heureka Service** | `${HEUREKA_SERVICE_PORT:-3800}` | 3800 | `HEUREKA_SERVICE_PORT` | Heureka XML feed generation |
| **API Gateway** | `${API_GATEWAY_PORT:-3801}` | 3801 | `API_GATEWAY_PORT` | Request routing and authentication |
| **Import Service** | `${IMPORT_SERVICE_PORT:-3802}` | 3802 | `IMPORT_SERVICE_PORT` | CSV import and transformation |
| **Settings Service** | `${HEUREKA_SETTINGS_SERVICE_PORT:-3803}` | 3803 | `HEUREKA_SETTINGS_SERVICE_PORT` | User settings and API key management |
| **Gateway Proxy** | `${GATEWAY_PROXY_PORT:-3804}` | 80 | `GATEWAY_PROXY_PORT` | Nginx gateway proxy |
| **Frontend Service** | `${HEUREKA_FRONTEND_SERVICE_PORT:-3805}` | 3805 | `HEUREKA_FRONTEND_SERVICE_PORT` | Web interface for users |

### Bazos Application Ports (39xx Range)

**Note**: All ports configured in `bazos-service/.env`. Values shown are defaults.

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **Bazos Service** | `${BAZOS_SERVICE_PORT:-3900}` | 3900 | `BAZOS_SERVICE_PORT` | Bazos classifieds automation |
| **API Gateway** | `${API_GATEWAY_PORT:-3901}` | 3901 | `API_GATEWAY_PORT` | Request routing and authentication |
| **Import Service** | `${IMPORT_SERVICE_PORT:-3902}` | 3902 | `IMPORT_SERVICE_PORT` | CSV import and transformation |
| **Settings Service** | `${BAZOS_SETTINGS_SERVICE_PORT:-3903}` | 3903 | `BAZOS_SETTINGS_SERVICE_PORT` | User settings and API key management |
| **Gateway Proxy** | `${GATEWAY_PROXY_PORT:-3904}` | 80 | `GATEWAY_PROXY_PORT` | Nginx gateway proxy |
| **Frontend Service** | `${BAZOS_FRONTEND_SERVICE_PORT:-3905}` | 3905 | `BAZOS_FRONTEND_SERVICE_PORT` | Web interface for users |

### Messenger Application Ports (40xx Range)

**Note**: All ports configured in `messenger/.env`. Values shown are defaults.

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------ | ----------- |
| **PostgreSQL** | `${POSTGRES_HOST_PORT:-4000}` | `${POSTGRES_PORT:-5432}` | `POSTGRES_HOST_PORT`, `POSTGRES_PORT` | PostgreSQL database for Synapse |
| **Redis** | `${REDIS_HOST_PORT:-4001}` | `${REDIS_PORT:-6379}` | `REDIS_HOST_PORT`, `REDIS_PORT` | Redis cache and worker coordination |
| **Synapse** | `${SYNAPSE_HOST_PORT:-4002}` | `${SYNAPSE_PORT:-3708}` | `SYNAPSE_HOST_PORT`, `SYNAPSE_PORT` | Matrix homeserver |
| **LiveKit** | `${LIVEKIT_HOST_PORT:-4003}` | `${LIVEKIT_HTTP_PORT:-7880}` | `LIVEKIT_HOST_PORT`, `LIVEKIT_HTTP_PORT` | LiveKit SFU for A/V calls |
| **Frontend (Element)** | `${FRONTEND_HOST_PORT:-4004}` | 80 | `FRONTEND_HOST_PORT` | Element X web client |

### Beauty Application Ports (41xx Range)

**Note**: All ports configured in `beauty/.env`. Values shown are defaults. Uses shared `database-server` instead of local database.

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **API Gateway** | `${API_GATEWAY_PORT:-4100}` | 4100 | `API_GATEWAY_PORT` | Request routing and tenant propagation |
| **Frontend** | `${PUBLIC_WEBSITE_PORT:-4102}` | 4102 | `PUBLIC_WEBSITE_PORT` | Public website and admin interface |
| **NATS** | `${NATS_PORT:-4104}` | 4222 | `NATS_PORT` | NATS event bus (client port) |
| **NATS HTTP** | `${NATS_HTTP_PORT:-4105}` | 8222 | `NATS_HTTP_PORT` | NATS monitoring port |
| **Booking Service** | `${BOOKING_SERVICE_PORT:-4110}` | 4110 | `BOOKING_SERVICE_PORT` | Online and offline appointment scheduling |
| **POS Service** | `${POS_SERVICE_PORT:-4111}` | 4111 | `POS_SERVICE_PORT` | Point of sale for services and products |
| **Payments Service** | `${PAYMENTS_SERVICE_PORT:-4112}` | 4112 | `PAYMENTS_SERVICE_PORT` | Payment processing adapter |
| **Inventory Service** | `${INVENTORY_SERVICE_PORT:-4113}` | 4113 | `INVENTORY_SERVICE_PORT` | Warehouse and inventory management |
| **Customer Service** | `${CUSTOMER_SERVICE_PORT:-4114}` | 4114 | `CUSTOMER_SERVICE_PORT` | Client management and history |
| **BI Service** | `${BI_SERVICE_PORT:-4115}` | 4115 | `BI_SERVICE_PORT` | Reporting and business intelligence |
| **Integration Hub Service** | `${INTEGRATION_HUB_SERVICE_PORT:-4116}` | 4116 | `INTEGRATION_HUB_SERVICE_PORT` | External integrations hub |
| **Staff Service** | `${STAFF_SERVICE_PORT:-4117}` | 4117 | `STAFF_SERVICE_PORT` | Staff management |
| **Reserved** | 4118-4119 | - | - | Reserved for future expansion |

### SpeakASAP Application Ports (42xx Range)

**Note**: All ports configured in `speakasap/.env`. Values shown are defaults. Uses shared `database-server` and microservices.

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **Content Service** | `${CONTENT_SERVICE_PORT:-4201}` | 4201 | `CONTENT_SERVICE_PORT` | Learning content and resources |
| **Certification Service** | `${CERTIFICATION_SERVICE_PORT:-4202}` | 4202 | `CERTIFICATION_SERVICE_PORT` | Certificates and achievements |
| **Assessment Service** | `${ASSESSMENT_SERVICE_PORT:-4203}` | 4203 | `ASSESSMENT_SERVICE_PORT` | Tests and assessments |
| **Course Service** | `${COURSE_SERVICE_PORT:-4205}` | 4205 | `COURSE_SERVICE_PORT` | Course products and pricing |
| **Education Service** | `${EDUCATION_SERVICE_PORT:-4206}` | 4206 | `EDUCATION_SERVICE_PORT` | Course catalog and structure |
| **User Service** | `${USER_SERVICE_PORT:-4207}` | 4207 | `USER_SERVICE_PORT` | User and teacher management |
| **Payment Service** | `${PAYMENT_SERVICE_PORT:-4208}` | 4208 | `PAYMENT_SERVICE_PORT` | Orders and payments |
| **Notification Service** | `${NOTIFICATION_SERVICE_PORT:-4209}` | 4209 | `NOTIFICATION_SERVICE_PORT` | Notifications |
| **API Gateway** | `${API_GATEWAY_PORT:-4210}` | 4210 | `API_GATEWAY_PORT` | Request routing and authentication |
| **Frontend** | `${FRONTEND_PORT:-4211}` | 4211 | `FRONTEND_PORT` | Frontend application |
| **Salary Service** | `${SALARY_SERVICE_PORT:-4212}` | 4212 | `SALARY_SERVICE_PORT` | Staff salary management |
| **Financial Service** | `${FINANCIAL_SERVICE_PORT:-4213}` | 4213 | `FINANCIAL_SERVICE_PORT` | Business financial analytics |
| **Marathon** | `${PORT:-4214}` | 4214 | `PORT` | Standalone marathon product |
| **Reserved** | 4200, 4204, 4215-4219 | - | - | Reserved for future expansion |

### SGIP Real Estate Application Ports (43xx Range)

**Note**: All ports configured in `sgiprealestate/.env`. Values shown are defaults. Single Next.js service with blue/green deployment support.

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **Main Service** (Blue) | `${PORT_BLUE:-4300}` | `${PORT:-4300}` | `PORT_BLUE`, `PORT` | Next.js application (blue deployment) |
| **Main Service** (Green) | `${PORT_GREEN:-4301}` | `${PORT:-4300}` | `PORT_GREEN`, `PORT` | Next.js application (green deployment) |
| **Reserved** | 4302-4309 | - | - | Reserved for future expansion |

### Leads Microservice Ports (44xx Range)

**Note**: All ports configured in `leads-microservice/.env`. Values shown are defaults.

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **Leads Microservice** (Blue) | `${PORT:-4400}` | `${PORT:-4400}` | `PORT` | Lead intake service (blue deployment) |
| **Leads Microservice** (Green) | `${PORT_GREEN:-4401}` | `${PORT:-4400}` | `PORT_GREEN`, `PORT` | Lead intake service (green deployment) |
| **Reserved** | 4402-4409 | - | - | Reserved for future expansion |

### Shop Assistant Application Ports (45xx Range)

**Note**: All ports configured in `shop-assistant/.env`. Values shown are defaults. Uses shared database, logging, auth, and ai-microservice; external search API (e.g. Serper).

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **Shop Assistant** (Blue) | `${PORT:-4500}` | `${PORT:-4500}` | `PORT` | AI shopping assistant API (blue deployment) |
| **Shop Assistant** (Green) | `${PORT_GREEN:-4501}` | `${PORT:-4500}` | `PORT_GREEN`, `PORT` | AI shopping assistant API (green deployment) |
| **Reserved** | 4502-4509 | - | - | Reserved for future expansion |

### Allegro Application Ports (34xx Range)

**Note**: All ports configured in `allegro-service/.env`. Values shown are defaults.

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **API Gateway** | `${API_GATEWAY_PORT}` | `${API_GATEWAY_PORT}` | `API_GATEWAY_PORT` | Request routing and authentication |
| **Product Service** | `${PRODUCT_SERVICE_PORT}` | `${PRODUCT_SERVICE_PORT}` | `PRODUCT_SERVICE_PORT` | Product catalog management |
| **Allegro Service** | `${ALLEGRO_SERVICE_PORT}` | `${ALLEGRO_SERVICE_PORT}` | `ALLEGRO_SERVICE_PORT` | Allegro API integration |
| **Sync Service** | `${SYNC_SERVICE_PORT}` | `${SYNC_SERVICE_PORT}` | `SYNC_SERVICE_PORT` | Bidirectional synchronization |
| **Webhook Service** | `${WEBHOOK_SERVICE_PORT}` | `${WEBHOOK_SERVICE_PORT}` | `WEBHOOK_SERVICE_PORT` | Allegro event polling and processing |
| **Import Service** | `${IMPORT_SERVICE_PORT}` | `${IMPORT_SERVICE_PORT}` | `IMPORT_SERVICE_PORT` | CSV import and transformation |
| **Scheduler Service** | `${SCHEDULER_SERVICE_PORT}` | `${SCHEDULER_SERVICE_PORT}` | `SCHEDULER_SERVICE_PORT` | Scheduled cron jobs |
| **Settings Service** | `${ALLEGRO_SETTINGS_SERVICE_PORT}` | `${ALLEGRO_SETTINGS_SERVICE_PORT}` | `ALLEGRO_SETTINGS_SERVICE_PORT` | User settings and API key management |
| **Frontend Service** | `${ALLEGRO_FRONTEND_SERVICE_PORT}` | `${ALLEGRO_FRONTEND_SERVICE_PORT}` | `ALLEGRO_FRONTEND_SERVICE_PORT` | Web interface for users |

### Crypto-AI-Agent Application Ports (31xx Range)

**Note**: All ports configured in `crypto-ai-agent/.env`. Values shown are defaults.

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **Frontend** (Blue) | `${FRONTEND_PORT}` | `${FRONTEND_PORT}` | `FRONTEND_PORT` | Next.js frontend application |
| **Frontend** (Green) | `${FRONTEND_PORT_GREEN}` | `${FRONTEND_PORT}` | `FRONTEND_PORT_GREEN` | Next.js frontend application (green deployment) |
| **Backend API** (Blue) | `${API_PORT}` | `${API_PORT}` | `API_PORT` | FastAPI backend service |
| **Backend API** (Green) | `${API_PORT_GREEN}` | `${API_PORT}` | `API_PORT_GREEN` | FastAPI backend service (green deployment) |
| **UI Port** | `${UI_PORT}` | `${UI_PORT}` | `UI_PORT` | Additional UI interface (Streamlit) |

**Note:** Green deployment uses different host ports but same container ports as blue deployment.

**Note:** crypto-ai-agent uses the shared **database-server** (db-server-postgres:${DB_SERVER_PORT}, db-server-redis:${REDIS_SERVER_PORT}) via the nginx-network, like all other applications. Local Postgres/Redis containers have been removed to eliminate port conflicts and ensure consistency across the ecosystem.

### Statex Application Ports (36xx Range)

**Note**: All ports configured in `statex/.env`. Values shown are defaults.

#### Core Platform Services

**Note**: These services support blue/green deployments. Blue and green use the same host ports (only one deployment is active at a time).

| Service | Host Port (Blue/Green) | Container Port | .env Variable | Description |
| ------- | ---------------------- | -------------- | ------------- | ----------- |
| **Platform Management** | `${PLATFORM_MANAGEMENT_PORT}` | 8000 | `PLATFORM_MANAGEMENT_PORT` | Central orchestration |
| **API Gateway** | `${API_GATEWAY_EXTERNAL_PORT}` | 80 | `API_GATEWAY_EXTERNAL_PORT` | Unified API access point |
| **Frontend** | `${FRONTEND_PORT}` | 3000 | `FRONTEND_PORT` | Next.js frontend application |

#### Website Services (statex-website)

**Note**: These services support blue/green deployments. Blue and green use the same host ports (only one deployment is active at a time).

| Service | Host Port (Blue/Green) | Container Port | .env Variable | Description |
| ------- | ---------------------- | -------------- | ------------- | ----------- |
| **Submission Service** | `${SUBMISSION_SERVICE_PORT}` | 8000 | `SUBMISSION_SERVICE_PORT` | Form submission and file handling |
| **User Portal** | `${USER_PORTAL_PORT}` | 8000 | `USER_PORTAL_PORT` | User management and authentication |
| **Content Service** | `${CONTENT_SERVICE_EXTERNAL_PORT}` | 8000 | `CONTENT_SERVICE_EXTERNAL_PORT` | Content management |

#### AI Services (ai-microservice)

**Note**: AI services are now managed as a separate microservice at `ai-microservice/`. These services support blue/green deployments.

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **AI Orchestrator** | `${AI_ORCHESTRATOR_PORT:-3380}` | `${AI_ORCHESTRATOR_PORT:-3380}` | `AI_ORCHESTRATOR_PORT` (ai-microservice/.env) | Central AI coordination |
| **NLP Service** | `${NLP_SERVICE_PORT:-3381}` | `${NLP_SERVICE_PORT:-3381}` | `NLP_SERVICE_PORT` (ai-microservice/.env) | Natural language processing |
| **ASR Service** | `${ASR_SERVICE_PORT:-3382}` | `${ASR_SERVICE_PORT:-3382}` | `ASR_SERVICE_PORT` (ai-microservice/.env) | Speech-to-text conversion |
| **Document AI** | `${DOCUMENT_AI_PORT:-3383}` | `${DOCUMENT_AI_PORT:-3383}` | `DOCUMENT_AI_PORT` (ai-microservice/.env) | Document analysis and OCR |
| **Prototype Generator** | `${PROTOTYPE_GENERATOR_PORT:-3384}` | `${PROTOTYPE_GENERATOR_PORT:-3384}` | `PROTOTYPE_GENERATOR_PORT` (ai-microservice/.env) | Prototype generation |
| **Template Repository** | `${TEMPLATE_REPOSITORY_PORT:-3385}` | `${TEMPLATE_REPOSITORY_PORT:-3385}` | `TEMPLATE_REPOSITORY_PORT` (ai-microservice/.env) | Template management |
| **Free AI Service** | `${FREE_AI_SERVICE_PORT:-3386}` | `${FREE_AI_SERVICE_PORT:-3386}` | `FREE_AI_SERVICE_PORT` (ai-microservice/.env) | Free AI processing |
| **AI Workers** | `${AI_WORKERS_PORT:-3387}` | `${AI_WORKERS_PORT:-3387}` | `AI_WORKERS_PORT` (ai-microservice/.env) | AI processing workers |
| **Gemini AI Service** | `${GEMINI_AI_SERVICE_PORT:-3388}` | `${GEMINI_AI_SERVICE_PORT:-3388}` | `GEMINI_AI_SERVICE_PORT` (ai-microservice/.env) | Google Gemini AI integration |
| **Data Viz Service** | `${DATA_VIZ_SERVICE_PORT:-3389}` | `${DATA_VIZ_SERVICE_PORT:-3389}` | `DATA_VIZ_SERVICE_PORT` (ai-microservice/.env) | Data visualization service |

**Note:** All AI services are now part of the separate `ai-microservice` and support blue/green deployments via `ai-microservice/docker-compose.blue.yml` and `ai-microservice/docker-compose.green.yml`.

#### Infrastructure Services (statex-infrastructure)

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **RabbitMQ** | `${RABBITMQ_PORT}` | `${RABBITMQ_PORT}` | `RABBITMQ_PORT` | Message queue (AMQP) |
| **RabbitMQ Management** | `${RABBITMQ_MANAGEMENT_PORT}` | `${RABBITMQ_MANAGEMENT_PORT}` | `RABBITMQ_MANAGEMENT_PORT` | RabbitMQ web UI |
| **MinIO** | `${MINIO_EXTERNAL_PORT}` | `${MINIO_INTERNAL_PORT}` | `MINIO_EXTERNAL_PORT` | Object storage API |
| **MinIO Console** | `${MINIO_CONSOLE_PORT}` | `${MINIO_CONSOLE_PORT}` | `MINIO_CONSOLE_PORT` | MinIO web console |
| **Elasticsearch** | `${ELASTICSEARCH_PORT}` | `${ELASTICSEARCH_PORT}` | `ELASTICSEARCH_PORT` | Search engine |

**Note:**

- PostgreSQL and Redis are provided by shared **database-server** (db-server-postgres:${DB_SERVER_PORT}, db-server-redis:${REDIS_SERVER_PORT}) via nginx-network
- Logging Service and Notification Service have been removed from statex and now use shared microservices (logging-microservice:${PORT}, notifications-microservice:${PORT})

#### Additional Statex Services

| Service | Host Port | Container Port | .env Variable | Description |
| ------- | --------- | -------------- | ------------- | ----------- |
| **Dashboard** | `${DASHBOARD_PORT}` | `${DASHBOARD_INTERNAL_PORT}` | `DASHBOARD_PORT` | Service management dashboard |
| **DNS Service** (HTTP API) | `${DNS_SERVICE_EXTERNAL_PORT}` | `${DNS_SERVICE_INTERNAL_PORT}` | `DNS_SERVICE_EXTERNAL_PORT` | DNS service HTTP API |
| **DNS Service** (DNS Server) | `${DNS_SERVER_PORT}` | `${DNS_SERVER_PORT}` | `DNS_SERVER_PORT` | DNS server (UDP/TCP) |

### Port Usage Summary by Port Number

| Port | Services Using This Port | Conflict Status |
| ---- | ------------------------ | --------------- |
| **80** | nginx-microservice | ✅ No conflict (single service) |
| **443** | nginx-microservice | ✅ No conflict (single service) |
| **3000** | Container ports (flipflop Frontend, statex Frontend) | ✅ No conflict (different host ports) |
| **3001** | statex Frontend Green (container) | ✅ No conflict (green deployment) |
| **3002-3009** | Container ports (flipflop services) | ✅ No conflict (different host ports) |
| **3100** | crypto-ai-agent Frontend (Blue) | ✅ No conflict |
| **3101** | crypto-ai-agent Frontend (Green) | ✅ No conflict (green deployment) |
| **3102** | crypto-ai-agent Backend API (Blue) | ✅ No conflict |
| **3103** | crypto-ai-agent Backend API (Green) | ✅ No conflict (green deployment) |
| **3104** | crypto-ai-agent UI Port (Streamlit) | ✅ No conflict |
| **3367** | logging-microservice | ✅ No conflict (single service) |
| **3368** | notifications-microservice | ✅ No conflict (single service) |
| **3369** | payments-microservice (Blue/Green) | ✅ No conflict (host port, container: 3468) |
| **3370** | auth-microservice (Blue) | ✅ No conflict |
| **3371** | auth-microservice (Green) | ✅ No conflict (green deployment) |
| **3402** | allegro-service Product Service | ✅ No conflict |
| **3403** | allegro-service Allegro Service | ✅ No conflict |
| **3404** | allegro-service Sync Service | ✅ No conflict |
| **3405** | allegro-service Webhook Service | ✅ No conflict |
| **3406** | allegro-service Import Service | ✅ No conflict |
| **3407** | allegro-service Scheduler Service | ✅ No conflict |
| **3408** | allegro-service Settings Service | ✅ No conflict |
| **3410** | allegro-service Frontend Service | ✅ No conflict |
| **3411** | allegro-service API Gateway | ✅ No conflict |
| **3500** | flipflop-service Frontend (host) | ✅ No conflict |
| **3502** | flipflop-service Product Service (host) | ✅ No conflict |
| **3503** | flipflop-service Order Service (host) | ✅ No conflict |
| **3504** | flipflop-service User Service (host) | ✅ No conflict |
| **3505** | flipflop-service Warehouse Service (host) | ✅ No conflict |
| **3506** | flipflop-service Supplier Service (host) | ✅ No conflict |
| **3507** | flipflop-service AI Service (host) | ✅ No conflict |
| **3508** | flipflop-service Analytics Service (host) | ✅ No conflict |
| **3509** | flipflop-service Cart Service (host) | ✅ No conflict |
| **3511** | flipflop-service API Gateway (host) | ✅ No conflict |
| **3200** | catalog-microservice (host) | ✅ No conflict |
| **3201** | warehouse-microservice (host) | ✅ No conflict |
| **3202** | suppliers-microservice (host) | ✅ No conflict |
| **3203** | orders-microservice (host) | ✅ No conflict |
| **3600** | statex Platform Management (host) | ✅ No conflict |
| **3700** | aukro-service Aukro Service (host) | ✅ No conflict |
| **3701** | aukro-service API Gateway (host) | ✅ No conflict |
| **3702** | aukro-service Import Service (host) | ✅ No conflict |
| **3703** | aukro-service Settings Service (host) | ✅ No conflict |
| **3704** | aukro-service Gateway Proxy (host) | ✅ No conflict |
| **3705** | aukro-service Frontend Service (host) | ✅ No conflict |
| **3800** | heureka-service Heureka Service (host) | ✅ No conflict |
| **3801** | heureka-service API Gateway (host) | ✅ No conflict |
| **3802** | heureka-service Import Service (host) | ✅ No conflict |
| **3803** | heureka-service Settings Service (host) | ✅ No conflict |
| **3804** | heureka-service Gateway Proxy (host) | ✅ No conflict |
| **3805** | heureka-service Frontend Service (host) | ✅ No conflict |
| **3900** | bazos-service Bazos Service (host) | ✅ No conflict |
| **3901** | bazos-service API Gateway (host) | ✅ No conflict |
| **3902** | bazos-service Import Service (host) | ✅ No conflict |
| **3903** | bazos-service Settings Service (host) | ✅ No conflict |
| **3904** | bazos-service Gateway Proxy (host) | ✅ No conflict |
| **3905** | bazos-service Frontend Service (host) | ✅ No conflict |
| **4000** | messenger PostgreSQL (host) | ✅ No conflict |
| **4100** | beauty Main Service (host) | ✅ No conflict |
| **4101** | beauty API Gateway (host) | ✅ No conflict |
| **4102** | beauty Frontend (host) | ✅ No conflict |
| **4103** | beauty Booking Service (host) | ✅ No conflict |
| **4104** | beauty POS Service (host) | ✅ No conflict |
| **4105** | beauty CRM Service (host) | ✅ No conflict |
| **4106** | beauty Inventory Service (host) | ✅ No conflict |
| **4107** | beauty BI Service (host) | ✅ No conflict |
| **4001** | messenger Redis (host) | ✅ No conflict |
| **4002** | messenger Synapse (host) | ✅ No conflict |
| **4003** | messenger LiveKit (host) | ✅ No conflict |
| **4004** | messenger Frontend (host) | ✅ No conflict |
| **4100** | beauty Main Service (host) | ✅ No conflict |
| **4101** | beauty API Gateway (host) | ✅ No conflict |
| **4102** | beauty Frontend (host) | ✅ No conflict |
| **4103** | beauty Booking Service (host) | ✅ No conflict |
| **4104** | beauty POS Service (host) | ✅ No conflict |
| **4105** | beauty CRM Service (host) | ✅ No conflict |
| **4106** | beauty Inventory Service (host) | ✅ No conflict |
| **4107** | beauty BI Service (host) | ✅ No conflict |
| **3601** | statex API Gateway (host) | ✅ No conflict |
| **3602** | statex Frontend (host) | ✅ No conflict |
| **3603** | statex Submission Service (host) | ✅ No conflict |
| **3606** | statex User Portal (host) | ✅ No conflict |
| **3609** | statex Content Service (host) | ✅ No conflict |
| **3380** | ai-microservice AI Orchestrator (host) | ✅ No conflict |
| **3381-3389** | ai-microservice AI services (host) | ✅ No conflict |
| **3620** | statex MinIO (host) | ✅ No conflict |
| **3621** | statex MinIO Console (host) | ✅ No conflict |
| **5432** | database-server PostgreSQL (localhost only) | ✅ No conflict - Shared via Docker network (db-server-postgres:5432) |
| **5672** | statex RabbitMQ | ✅ No conflict |
| **6379** | database-server Redis (localhost only) | ✅ No conflict - Shared via Docker network (db-server-redis:6379) |
| **8000** | Container ports (statex Platform Management, Submission Service, Content Service, User Portal) | ✅ No conflict (different host ports: 3600, 3603, 3609, 3606) |
| **3380-3389** | ai-microservice AI services (host and container ports match) | ✅ No conflict (separate microservice) |
| **8020** | Container port (statex Dashboard) | ✅ No conflict (host port: 3626) |
| **5353** | statex DNS Service (DNS server UDP/TCP) | ✅ No conflict |
| **5672** | statex RabbitMQ (AMQP) | ✅ No conflict |
| **8053** | statex DNS Service (HTTP API) | ✅ No conflict |
| **9000** | Container port (statex MinIO) | ✅ No conflict (host port: 3620) |
| **9001** | Container port (statex MinIO Console) | ✅ No conflict (host port: 3621) |
| **9200** | statex Elasticsearch | ✅ No conflict |
| **15672** | statex RabbitMQ Management | ✅ No conflict |

### Port Conflict Analysis (Based on Current Configs)

**What we checked:**

- **Configs used**: all `docker-compose*.yml` files in every app/microservice, plus all top-level `.env` files (allegro-service, flipflop-service, crypto-ai-agent, statex, database-server, nginx-microservice, logging-microservice, notifications-microservice, payments-microservice, auth-microservice, ai-microservice).
- **Scope**: host ports exposed with `ports:` in Docker Compose and all `*_PORT` variables in `.env`.
- **Verification Date**: 2025-12-04
- **Status**: ✅ **NO PORT CONFLICTS DETECTED** - All ports verified across all applications and microservices (including ai-microservice ports 3380-3389, aukro-service ports 3700-3705, heureka-service ports 3800-3805, bazos-service ports 3900-3905, messenger ports 4000-4004, beauty ports 4100-4107)

### Complete Port Reference Table

**Important**: All ports are configured in respective `.env` files. This table shows default values for reference. Always check the `.env` file for the actual configured port.

This table lists all host ports used across all services for quick conflict checking:

| Port (Default) | .env Variable | Service | Application/Microservice | Notes |
| -------------- | ------------- | ------- | ------------------------ | ----- |
| **80** | N/A | nginx | nginx-microservice | HTTP (standard port) |
| **443** | N/A | nginx | nginx-microservice | HTTPS (standard port) |
| **3100** | `FRONTEND_PORT` | Frontend | crypto-ai-agent (Blue) | crypto-ai-agent/.env |
| **3101** | `FRONTEND_PORT_GREEN` | Frontend | crypto-ai-agent (Green) | crypto-ai-agent/.env |
| **3367** | `PORT` | Logging Service | logging-microservice | logging-microservice/.env |
| **3368** | `PORT` | Notification Service | notifications-microservice | notifications-microservice/.env |
| **3369** | `PORT_BLUE`/`PORT_GREEN` | Payment Service | payments-microservice (Blue/Green) | payments-microservice/.env (container: `SERVICE_PORT`=3468) |
| **3370** | `PORT` | Auth Service | auth-microservice (Blue) | auth-microservice/.env |
| **3371** | N/A | Auth Service | auth-microservice (Green) | Host port (container: `PORT`=3370) |
| **3402** | `PRODUCT_SERVICE_PORT` | Product Service | allegro-service | allegro-service/.env |
| **3403** | `ALLEGRO_SERVICE_PORT` | Allegro Service | allegro-service | allegro-service/.env |
| **3404** | `SYNC_SERVICE_PORT` | Sync Service | allegro-service | allegro-service/.env |
| **3405** | `WEBHOOK_SERVICE_PORT` | Webhook Service | allegro-service | allegro-service/.env |
| **3406** | `IMPORT_SERVICE_PORT` | Import Service | allegro-service | allegro-service/.env |
| **3407** | `SCHEDULER_SERVICE_PORT` | Scheduler Service | allegro-service | allegro-service/.env |
| **3408** | `ALLEGRO_SETTINGS_SERVICE_PORT` | Settings Service | allegro-service | allegro-service/.env |
| **3410** | `ALLEGRO_FRONTEND_SERVICE_PORT` | Frontend Service | allegro-service | allegro-service/.env |
| **3411** | `API_GATEWAY_PORT` | API Gateway | allegro-service | allegro-service/.env |
| **3500** | `FRONTEND_PORT` | Frontend | flipflop-service | flipflop-service/.env |
| **3502** | `PRODUCT_SERVICE_PORT` | Product Service | flipflop-service | flipflop-service/.env |
| **3503** | `ORDER_SERVICE_PORT` | Order Service | flipflop-service | flipflop-service/.env |
| **3504** | `USER_SERVICE_PORT` | User Service | flipflop-service | flipflop-service/.env |
| **3505** | `WAREHOUSE_SERVICE_PORT` | Warehouse Service | flipflop-service | flipflop-service/.env |
| **3506** | `SUPPLIER_SERVICE_PORT` | Supplier Service | flipflop-service | flipflop-service/.env |
| **3507** | `AI_SERVICE_PORT` | AI Service | flipflop-service | flipflop-service/.env |
| **3508** | `ANALYTICS_SERVICE_PORT` | Analytics Service | flipflop-service | flipflop-service/.env |
| **3509** | `CART_SERVICE_PORT` | Cart Service | flipflop-service | flipflop-service/.env |
| **3511** | `API_GATEWAY_PORT` | API Gateway | flipflop-service | flipflop-service/.env |
| **3200** | `PORT` | Catalog Microservice | catalog-microservice | catalog-microservice/.env |
| **3201** | `PORT` | Warehouse Microservice | warehouse-microservice | warehouse-microservice/.env |
| **3202** | `PORT` | Suppliers Microservice | suppliers-microservice | suppliers-microservice/.env |
| **3203** | `PORT` | Orders Microservice | orders-microservice | orders-microservice/.env |
| **3600** | `PLATFORM_MANAGEMENT_PORT` | Platform Management | statex | statex/.env |
| **3700** | `AUKRO_SERVICE_PORT` | Aukro Service | aukro-service | aukro-service/.env |
| **3701** | `API_GATEWAY_PORT` | API Gateway | aukro-service | aukro-service/.env |
| **3702** | `IMPORT_SERVICE_PORT` | Import Service | aukro-service | aukro-service/.env |
| **3703** | `AUKRO_SETTINGS_SERVICE_PORT` | Settings Service | aukro-service | aukro-service/.env |
| **3704** | `GATEWAY_PROXY_PORT` | Gateway Proxy | aukro-service | aukro-service/.env |
| **3705** | `AUKRO_FRONTEND_SERVICE_PORT` | Frontend Service | aukro-service | aukro-service/.env |
| **3800** | `HEUREKA_SERVICE_PORT` | Heureka Service | heureka-service | heureka-service/.env |
| **3801** | `API_GATEWAY_PORT` | API Gateway | heureka-service | heureka-service/.env |
| **3802** | `IMPORT_SERVICE_PORT` | Import Service | heureka-service | heureka-service/.env |
| **3803** | `HEUREKA_SETTINGS_SERVICE_PORT` | Settings Service | heureka-service | heureka-service/.env |
| **3804** | `GATEWAY_PROXY_PORT` | Gateway Proxy | heureka-service | heureka-service/.env |
| **3805** | `HEUREKA_FRONTEND_SERVICE_PORT` | Frontend Service | heureka-service | heureka-service/.env |
| **3900** | `BAZOS_SERVICE_PORT` | Bazos Service | bazos-service | bazos-service/.env |
| **3901** | `API_GATEWAY_PORT` | API Gateway | bazos-service | bazos-service/.env |
| **3902** | `IMPORT_SERVICE_PORT` | Import Service | bazos-service | bazos-service/.env |
| **3903** | `BAZOS_SETTINGS_SERVICE_PORT` | Settings Service | bazos-service | bazos-service/.env |
| **3904** | `GATEWAY_PROXY_PORT` | Gateway Proxy | bazos-service | bazos-service/.env |
| **3905** | `BAZOS_FRONTEND_SERVICE_PORT` | Frontend Service | bazos-service | bazos-service/.env |
| **4000** | `POSTGRES_HOST_PORT` | PostgreSQL | messenger | messenger/.env |
| **4001** | `REDIS_HOST_PORT` | Redis | messenger | messenger/.env |
| **4002** | `SYNAPSE_HOST_PORT` | Synapse | messenger | messenger/.env |
| **4003** | `LIVEKIT_HOST_PORT` | LiveKit | messenger | messenger/.env |
| **4004** | `FRONTEND_HOST_PORT` | Frontend (Element) | messenger | messenger/.env |
| **4100** | `API_GATEWAY_PORT` | API Gateway | beauty | beauty/.env |
| **4102** | `PUBLIC_WEBSITE_PORT` | Frontend | beauty | beauty/.env |
| **4104** | `NATS_PORT` | NATS Event Bus | beauty | beauty/.env |
| **4105** | `NATS_HTTP_PORT` | NATS HTTP | beauty | beauty/.env |
| **4110** | `BOOKING_SERVICE_PORT` | Booking Service | beauty | beauty/.env |
| **4111** | `POS_SERVICE_PORT` | POS Service | beauty | beauty/.env |
| **4112** | `PAYMENTS_SERVICE_PORT` | Payments Service | beauty | beauty/.env |
| **4113** | `INVENTORY_SERVICE_PORT` | Inventory Service | beauty | beauty/.env |
| **4114** | `CUSTOMER_SERVICE_PORT` | Customer Service | beauty | beauty/.env |
| **4115** | `BI_SERVICE_PORT` | BI Service | beauty | beauty/.env |
| **4116** | `INTEGRATION_HUB_SERVICE_PORT` | Integration Hub | beauty | beauty/.env |
| **4117** | `STAFF_SERVICE_PORT` | Staff Service | beauty | beauty/.env |
| **4201** | `CONTENT_SERVICE_PORT` | Content Service | speakasap | speakasap/.env |
| **4202** | `CERTIFICATION_SERVICE_PORT` | Certification Service | speakasap | speakasap/.env |
| **4203** | `ASSESSMENT_SERVICE_PORT` | Assessment Service | speakasap | speakasap/.env |
| **4205** | `COURSE_SERVICE_PORT` | Course Service | speakasap | speakasap/.env |
| **4206** | `EDUCATION_SERVICE_PORT` | Education Service | speakasap | speakasap/.env |
| **4207** | `USER_SERVICE_PORT` | User Service | speakasap | speakasap/.env |
| **4208** | `PAYMENT_SERVICE_PORT` | Payment Service | speakasap | speakasap/.env |
| **4209** | `NOTIFICATION_SERVICE_PORT` | Notification Service | speakasap | speakasap/.env |
| **4210** | `API_GATEWAY_PORT` | API Gateway | speakasap | speakasap/.env |
| **4211** | `FRONTEND_PORT` | Frontend | speakasap | speakasap/.env |
| **4212** | `SALARY_SERVICE_PORT` | Salary Service | speakasap | speakasap/.env |
| **4213** | `FINANCIAL_SERVICE_PORT` | Financial Service | speakasap | speakasap/.env |
| **4214** | `PORT` | Marathon | marathon | marathon/.env |
| **4300** | `PORT` / `PORT_BLUE` | Main Service (Blue) | sgiprealestate | sgiprealestate/.env |
| **4301** | `PORT_GREEN` | Main Service (Green) | sgiprealestate | sgiprealestate/.env |
| **4400** | `PORT` | Leads Microservice (Blue) | leads-microservice | leads-microservice/.env |
| **4401** | `PORT_GREEN` | Leads Microservice (Green) | leads-microservice | leads-microservice/.env |
| **4500** | `PORT` | Shop Assistant (Blue) | shop-assistant | shop-assistant/.env |
| **4501** | `PORT_GREEN` | Shop Assistant (Green) | shop-assistant | shop-assistant/.env |
| **3601** | `API_GATEWAY_EXTERNAL_PORT` | API Gateway | statex | statex/.env |
| **3602** | `FRONTEND_PORT` | Frontend | statex | statex/.env |
| **3603** | `SUBMISSION_SERVICE_PORT` | Submission Service | statex | statex/.env |
| **3606** | `USER_PORTAL_PORT` | User Portal | statex | statex/.env |
| **3609** | `CONTENT_SERVICE_EXTERNAL_PORT` | Content Service | statex | statex/.env |
| **3380** | `AI_ORCHESTRATOR_PORT` | AI Orchestrator | ai-microservice | ai-microservice/.env |
| **3381** | `NLP_SERVICE_PORT` | NLP Service | ai-microservice | ai-microservice/.env |
| **3382** | `ASR_SERVICE_PORT` | ASR Service | ai-microservice | ai-microservice/.env |
| **3383** | `DOCUMENT_AI_PORT` | Document AI | ai-microservice | ai-microservice/.env |
| **3384** | `PROTOTYPE_GENERATOR_PORT` | Prototype Generator | ai-microservice | ai-microservice/.env |
| **3385** | `TEMPLATE_REPOSITORY_PORT` | Template Repository | ai-microservice | ai-microservice/.env |
| **3386** | `FREE_AI_SERVICE_PORT` | Free AI Service | ai-microservice | ai-microservice/.env |
| **3387** | `AI_WORKERS_PORT` | AI Workers | ai-microservice | ai-microservice/.env |
| **3388** | `GEMINI_AI_SERVICE_PORT` | Gemini AI Service | ai-microservice | ai-microservice/.env |
| **3389** | `DATA_VIZ_SERVICE_PORT` | Data Viz Service | ai-microservice | ai-microservice/.env |
| **3620** | `MINIO_EXTERNAL_PORT` | MinIO | statex-infrastructure | statex/.env |
| **3621** | `MINIO_CONSOLE_PORT` | MinIO Console | statex-infrastructure | statex/.env |
| **3626** | `DASHBOARD_PORT` | Dashboard | statex | statex/.env |
| **5353** | `DNS_SERVER_PORT` | DNS Server | statex-dns-service | statex/.env (UDP/TCP) |
| **5432** | `DB_SERVER_PORT` | PostgreSQL | database-server | database-server/.env (localhost only) |
| **5672** | `RABBITMQ_PORT` | RabbitMQ | statex-infrastructure | statex/.env |
| **6379** | `REDIS_SERVER_PORT` | Redis | database-server | database-server/.env (localhost only) |
| **8053** | `DNS_SERVICE_EXTERNAL_PORT` | DNS Service API | statex-dns-service | statex/.env (HTTP) |
| **3102** | `API_PORT` | Backend API | crypto-ai-agent (Blue) | crypto-ai-agent/.env |
| **3103** | `API_PORT_GREEN` | Backend API | crypto-ai-agent (Green) | crypto-ai-agent/.env |
| **3104** | `UI_PORT` | UI Port | crypto-ai-agent | crypto-ai-agent/.env (Streamlit) |
| **9200** | `ELASTICSEARCH_PORT` | Elasticsearch | statex-infrastructure | statex/.env |
| **15672** | `RABBITMQ_MANAGEMENT_PORT` | RabbitMQ Management | statex-infrastructure | statex/.env |

---

## 🔍 Service Status

Check service status:

```bash
# On production server
ssh statex
docker ps | grep -E 'nginx|database|notification|logging|payment|auth|ai'

# Check health endpoints
curl https://notifications.statex.cz/health
curl https://logging.statex.cz/health
curl https://payments.statex.cz/health
curl https://auth.statex.cz/health
curl https://ai.statex.cz/health
```

---

## 📖 Documentation

- **FlipFlop Platform**: `/Users/sergiystashok/Documents/GitHub/statex.cz/flipflop-service/docs/`
- **Statex Platform**: `/home/statex/statex/docs/`
- **Microservice READMEs**: Each microservice has its own README.md

---

## 🤝 Contributing

When adding new microservices or updating existing ones:

1. Follow the standard structure
2. Document in this README
3. Update all applications using the service
4. Test cross-service communication
5. Update environment variable documentation

---

## 📞 Support

For issues or questions:

- Check individual microservice READMEs
- Review application documentation
- Check service logs: `docker logs <service-name>`
- Verify network connectivity: `docker network inspect nginx-network`

---

**Last Updated**: 2025-01-27

**Port Documentation Last Verified**: 2025-01-27

- ✅ All port ranges verified (31xx-44xx)
- ✅ No port conflicts detected
- ✅ All applications and microservices documented
- ✅ All .env files and docker-compose files checked
- ✅ Port refactoring completed for beauty (41xx), speakasap (42xx), sgiprealestate (43xx), leads-microservice (44xx)
- ✅ All .env files updated and synced to production

**Maintained by**: Statex Development Team
