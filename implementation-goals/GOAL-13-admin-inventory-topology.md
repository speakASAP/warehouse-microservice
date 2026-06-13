# GOAL-13 - Admin Inventory Topology Visibility

Metadata:
- id: WH-G13
- status: done
- owner: warehouse-owner
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: complete

## Intent

Expose the WH-G12 inventory topology read model in the existing Warehouse admin console so operators can see local and supplier-managed stock sources without calling raw APIs.

## Scope

- Load GET /api/warehouses/topology in the admin console.
- Show topology totals and per-warehouse origin rows.
- Support optional Catalog productId filtering.
- Keep the change read-only and source-only.

## Completion Evidence

- Added topology summary and table to the Warehouses panel.
- Added optional product filter wired to the WH-G12 endpoint.
- No stock mutation or production deployment was performed.
