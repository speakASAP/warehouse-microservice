# PROMPT-WH-G13-CONFLICTS - Supplier Conflict Operations

Implement or review the WH-G13-CONFLICTS supplier conflict operations work.

Preserve these boundaries:
- Warehouse owns reconciliation evidence and stock quantities.
- Supplier conflict review is operational metadata only.
- Do not perform production stock mutation or deployment without explicit owner approval.
- Complete IPS artifacts and validation reports before handoff.

Required validation:
- `npm test -- --runInBand test/supplier-reconciliation.service.spec.ts`
- `npm test -- --runInBand`
- `npm run build`
- `git diff --check`
