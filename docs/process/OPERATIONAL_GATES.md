# Operational Gates

Run the narrowest relevant gates for each session.

## Pre-Implementation Gate

- Read required orchestration and goal documents.
- Check `git status --short --branch`.
- Check the remote working tree when editing over SSH.
- Confirm the selected goal is ready and dependencies are complete.
- Prepare or update the IPS task document, execution plan, context package, coding prompt, and validation report draft before coding.
- Identify file ownership and validation commands.
- Record project invariant impact, sensitive-data classification, contract/schema impact, and replay/determinism impact.
- For stock mutation work, complete `docs/12_validation/PRE_CODING_GATE.md`.

## Coding Gate

- No production stock mutation without explicit owner-approved task context.
- No controller contract changes without DTO/validation coverage.
- No stock write logic changes without transaction and invariant tests.
- No event path changes without health/readiness or observable failure evidence.
- No reservation lifecycle changes without idempotency and payment retry coverage.

## Validation Gate

Use the narrowest commands available for the touched area, typically:

```bash
npm run build
npm test
node --check public/app.js
curl -sk https://warehouse.alfares.cz/api/health
curl -sk https://warehouse.alfares.cz/api/ready
```

For remote service work, prefer:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/warehouse-microservice && npm run build'
ssh alfares 'cd /home/ssf/Documents/Github/warehouse-microservice && npm test'
```

## Completion Gate

Before ending a session:

- update the relevant validation report under `docs/12_validation/`;
- update `docs/IMPLEMENTATION_STATE.md`;
- update `TASKS.md`;
- update `STATE.json`;
- record validation evidence or the reason validation could not run;
- list changed files;
- state the next command.
