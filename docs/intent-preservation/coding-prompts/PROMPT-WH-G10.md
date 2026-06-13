# PROMPT-WH-G10 - Coding Prompt

Implement a public landing page for `warehouse-microservice` and an authenticated admin entry flow. Use Auth-owned `POST /auth/login` and `POST /auth/register` endpoints. Store returned access tokens only for browser API use. Decode role claims in the browser to hide the admin workspace unless roles include `global:superadmin` or `internal:warehouse-microservice:admin`; preserve server-side `JwtRolesGuard` as the authoritative protection. Validate with JS syntax checks and Nest build. Do not deploy without explicit owner approval.
