# VAL-WH-G14-AUTH - Validation Report

Metadata:
- id: VAL-WH-G14-AUTH
- status: deployed
- goal_id: WH-G14-AUTH
- task_ids: WH-G14-AUTH-T1
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: complete

## Validation Evidence

| Command | Status | Notes |
| --- | --- | --- |
| DocsRAG query | blocked | Auth pod lacks curl; no token or secret value was printed. Compensating evidence came from Auth contract docs/source: docs/UNIFIED_AUTH_CONTRACT.md, docs/CONSUMER_JWT_VALIDATION_STANDARD.md, and docs/INTERNAL_SERVICE_AUTH_BOUNDARY_REVIEW.md. |
| npm test -- --runInBand test/authenticated-actor.spec.ts | passed | 1 suite, 6 tests passed. Verified JWT-derived user actor, service-claim actor, fail-closed missing subject, and spoofed body actor ignored for stock, reservation, and supplier reconciliation controllers. |
| npm test -- --runInBand | passed | 7 suites, 47 tests passed against the current combined remote source. |
| npm run build | passed | Nest build exited successfully. |
| git diff --check | passed | No whitespace errors in the current remote diff. |

## Result

WH-G14-AUTH passed source validation. Warehouse mutation controllers now derive stock evidence actors from verified Auth request context instead of trusting body actor. Body actor remains accepted as deprecated input for compatibility, but it is ignored for mutation evidence. No production stock mutation and no deployment were performed.

## Residual Risks

- [UNKNOWN: final ecosystem service-JWT claim name] Auth docs do not define a standardized service identity JWT claim. The helper supports serviceName, service, and clientId when present, and otherwise falls back to Auth subject identity.
- [MISSING: orchestrator numbering reconciliation] Delegation called this WH-G14, but remote WH-G14 is already completed product-logistics history. This validation report uses WH-G14-AUTH to avoid overwriting completed evidence.
- The remote worktree contains unrelated uncommitted parallel-worker changes. Validation ran against the combined source state.


## Deployment Evidence

- Deployed on 2026-06-15 as part of integrated WH-G10+ wave.
- Commit: `fab5bee`.
- Image: `localhost:5000/warehouse-microservice:fab5bee`.
- Validation: deployment script completed successfully; production `/api/health`, `/api/ready`, `/admin`, and manual reservation-expiry CronJob smoke passed.
