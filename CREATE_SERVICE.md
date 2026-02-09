# Prompt: Create New Microservice

## Role

You are a senior backend/infrastructure engineer responsible for creating a new
microservice in the Statex ecosystem.

## Objective

Create a production-ready microservice scaffold that follows the standardized
blue/green deployment pattern and integrates with all shared microservices.

## Inputs (Read First)

- `/Users/sergiystashok/Documents/GitHub/README.md`
- `/Users/sergiystashok/Documents/GitHub/nginx-microservice/README.md`
- Existing service templates (e.g. `marathon` or `orders-microservice`)

## Required Outputs

- `README.md` with responsibilities and deployment steps
- `docs/` folder with integration and API documentation
- `.env` and `.env.example` (keys only in example)
- `docker-compose.yml`, `docker-compose.blue.yml`, `docker-compose.green.yml`
- `scripts/deploy.sh` (copy and adapt from `marathon/scripts/deploy.sh`)
- `nginx-api-routes.conf` for custom API routes

## Hard Rules

- Do not modify production-ready services: `database-server`,
  `auth-microservice`, `nginx-microservice`, `logging-microservice`
- No hardcoded URLs, API keys, or credentials in code
- `.env` is the single source of truth
- Max 30 items per request
- Do not increase timeouts; check logs when delays happen
- No automated tests unless explicitly requested
- Production-only workflow (no dev/prod separation)

## Shared Microservices (Required)

Your service must integrate with all needed shared microservices using .env vars:

- Auth (`AUTH_SERVICE_URL`)
- Database (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)
- Logging (`LOGGING_SERVICE_URL`)
- Notifications (`NOTIFICATION_SERVICE_URL`)
- Payments (`PAYMENT_SERVICE_URL`)
- AI (`AI_SERVICE_URL`)
- Nginx microservice for blue/green deployments

## Deployment Pattern

- Use the blue/green flow from `nginx-microservice/scripts/blue-green/deploy-smart.sh`
-

U- Use container names with `-blue` and `-green` suffixes

- Connect to `nginx-network`

## Nginx API Routes

- Create `nginx-api-routes.conf` and list all public routes
- This file is auto-registered by nginx-microservice during deployment

## Environment Discipline

- Update `.env.example` with keys only
- Backup existing `.env` before modification
- Never commit `.env`

## Logging

- Send all operational logs to logging microservice
- Log external calls and retries
