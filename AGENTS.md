# Agents: warehouse-microservice

## Required Reading
Read AGENTS.md, TASKS.md, STATE.json, BUSINESS.md, SYSTEM.md, and applicable architecture and operations documentation.

## Authority
Approved repository source and documentation are authoritative; do not infer undocumented integrations.

## Service-to-service authentication
For machine service identity, follow the sole canonical [`SERVICE_IDENTITY_CONSUMER_STANDARD.md`](../auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md). It is not reproduced here.

**Known non-conformance — do not copy or extend.** `JwtRolesGuard` (`src/auth/jwt-roles.guard.ts`, `resolveStaticServiceActor`) retains live static shared-secret branches for `WAREHOUSE_MAINTENANCE_TOKEN` and `CLIPLOT_WAREHOUSE_SERVICE_TOKEN`. The guard is wired globally through `APP_GUARD`.

A shared static secret is not an Auth-issued RS256 principal per `(caller -> warehouse-microservice)` pair and is not revocable per caller, so it is prohibited by the standard above. Note that `docs/runbooks/operations.md` correctly describes the reservation-expiry CronJob presenting its own Auth-issued credential — that is true for that one caller and does not cover these static branches.

Do not add callers or routes to this path; the fix is per-pair Auth-issued RS256 credentials.

## Intent Preservation System
Preserve Vision through Goal Impact, System, Feature, Task, Execution Plan, Coding Prompt, Code, and Validation.

## Safety and Operations
Never print secrets, credentials, raw production data, or private evidence; follow the remote repository operating rules.

## Project-Specific Rules
Preserve this repository ownership boundary: Inventory and stock management for the e-commerce ecosystem.

## Required Final Report
Report changed files, validation evidence, debt, blockers, deviations, and next action.
