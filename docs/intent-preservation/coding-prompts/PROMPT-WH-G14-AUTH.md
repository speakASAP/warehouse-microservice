# PROMPT-WH-G14-AUTH - Coding Prompt

Implement authenticated actor enforcement in `warehouse-microservice` on `alfares` only. Do not deploy.

Preserve Auth ownership of JWT/RBAC and Warehouse ownership of stock movement evidence. Add a helper that derives mutation actor from verified `request.user` claims attached by `JwtRolesGuard`. Wire stock mutation, reservation lifecycle, and supplier reconciliation controllers so body `actor` is no longer authoritative. Keep body `actor` optional/deprecated for compatibility. Add focused tests proving spoofed body actors are ignored. Validate with `npm test -- --runInBand`, `npm run build`, and `git diff --check`.
