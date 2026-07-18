# WH-G13-T1 - Show Inventory Topology In Admin

Metadata:
- id: WH-G13-T1
- goal_id: WH-G13
- status: done
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: complete

## Task

Render the Warehouse inventory topology read model inside the existing admin Warehouses panel.

## Validation

- node --check public/admin/app.js
- npm run build
- git diff --check
