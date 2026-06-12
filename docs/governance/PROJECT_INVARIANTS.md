# Warehouse Project Invariants

These rules are non-negotiable unless the owner explicitly changes the product intent.

1. Warehouse is the stock and availability authority.
2. Catalog owns product identity, content, pricing, media, categories, attributes, and publication readiness.
3. Auth owns login, JWT, RBAC, and service identity.
4. Orders owns order state; warehouse owns stock effects of order state.
5. FlipFlop and channel services may read or cache availability, but they must not become stock authorities.
6. Stock movement history is append-only business evidence.
7. Stock mutations require actor/service identity, reason code, and authorization.
8. Negative quantity, reserved, or available stock states are invalid.
9. Reservation, fulfillment, cancellation, expiry, return, and supplier reconciliation flows must be idempotent.
10. Stock events must be observable. A broken event path must not masquerade as full readiness.
11. AI agents must never adjust production stock without explicit owner-approved task context.
12. Production deployment requires explicit owner approval in the current session.

