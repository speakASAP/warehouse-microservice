/**
 * Warehouse role vocabulary.
 *
 * Every route must be decorated with one of these constants. Nothing may rely on
 * the guard's default fallback: an undecorated route inherits the broadest role
 * set in the service, which is how a read-only caller ended up able to mutate
 * stock (see docs/RS256_SERVICE_TOKEN_MIGRATION_PLAN.md, Q2).
 *
 * Three tiers, narrowest first:
 *   READ    - observe stock//reservations/topology. Safe for cross-service callers.
 *   WRITE   - mutate quantities and reservations. Operational callers only.
 *   ADMIN   - manage warehouses themselves and review supplier reconciliations.
 *
 * `internal:warehouse-microservice:readonly` is the role minted for per-pair
 * service JWTs whose caller only needs to read (catalog -> warehouse).
 */

export const WAREHOUSE_READ_ROLES = [
  'global:superadmin',
  'internal:warehouse-microservice:admin',
  'internal:warehouse-microservice:action-admin',
  'internal:warehouse-microservice:readonly',
] as const;

export const WAREHOUSE_WRITE_ROLES = [
  'global:superadmin',
  'internal:warehouse-microservice:admin',
  'internal:warehouse-microservice:action-admin',
] as const;

export const WAREHOUSE_ADMIN_ROLES = [
  'global:superadmin',
  'internal:warehouse-microservice:admin',
] as const;

/**
 * Fulfillment callbacks driven by the Allegro integration. Kept separate so the
 * marketplace lane cannot reach general warehouse mutations.
 */
export const ALLEGRO_FULFILLMENT_ROLES = [
  'internal:allegro-service:service',
  'global:superadmin',
  'internal:warehouse-microservice:admin',
] as const;

/**
 * Orders drives fulfillment lifecycle transitions.
 */
export const FULFILLMENT_WRITE_ROLES = [
  'global:superadmin',
  'internal:warehouse-microservice:admin',
  'internal:warehouse-microservice:action-admin',
  'internal:orders-microservice:service',
] as const;

/**
 * Warehouse's own scheduled maintenance (the reservation-expiry CronJob calling
 * POST /api/reservations/expire-due). This is warehouse acting on itself, not a
 * cross-service call, so it gets a dedicated identity rather than borrowing a
 * caller's credential.
 *
 * It previously ran on CLIPLOT_WAREHOUSE_SERVICE_TOKEN, which is cliplot's
 * external credential sourced from `secret/prod/cliplot` and also mounted by
 * heureka. Restricting that token to read-only broke this job, which is the
 * correct signal: a shared external token should never have carried write rights.
 */
export const WAREHOUSE_MAINTENANCE_ROLES = [
  'global:superadmin',
  'internal:warehouse-microservice:admin',
  'internal:warehouse-microservice:action-admin',
  'internal:warehouse-microservice:maintenance',
] as const;
