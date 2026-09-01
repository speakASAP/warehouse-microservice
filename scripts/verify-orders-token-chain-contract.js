/**
 * Session F regression guard, 2026-09-01.
 *
 * warehouse -> orders (notifyOrdersStatus) used to resolve
 *   ORDERS_SERVICE_TOKEN || JWT_TOKEN
 * and JWT_TOKEN holds the shared `a2880693` value: one roleless string
 * (serviceId=alfares-agent-rag, no sub, no roles) that was simultaneously the
 * credential for five other services and cannot be revoked per-caller.
 *
 * orders stopped accepting that value when header-chosen identity was closed, and
 * its inbound ExternalSecret entry has since been deleted, so the fallback could
 * only ever turn a missing primary into a 401 that looks like a credential problem
 * on this side. This pins the removal so a well-meaning "restore the fallback" edit
 * fails loudly instead of silently re-sharing the value.
 */
const fs = require('fs');
const assert = require('assert');

const SERVICE = 'src/fulfillment/fulfillment-orders.service.ts';
const EXTERNAL_SECRET = 'k8s/external-secret.yaml';

const source = fs.readFileSync(SERVICE, 'utf8');
const externalSecret = fs.readFileSync(EXTERNAL_SECRET, 'utf8');

// Strip comments so the prose explaining the removal cannot satisfy these checks.
const code = source
  .split('\n')
  .filter((line) => {
    const t = line.trim();
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
  })
  .join('\n');

assert(
  !/process\.env\.JWT_TOKEN/.test(code),
  `${SERVICE}: must not read JWT_TOKEN — it holds the shared a2880693 value`,
);

assert(
  /process\.env\.ORDERS_SERVICE_TOKEN/.test(code),
  `${SERVICE}: must still read ORDERS_SERVICE_TOKEN, the per-pair RS256 principal`,
);

assert(
  !/'x-internal-service-token'/.test(code),
  `${SERVICE}: must not send the static x-internal-service-token header to orders`,
);

assert(
  /Authorization/.test(code),
  `${SERVICE}: must authenticate to orders with a Bearer Authorization header`,
);

// A missing credential must fail loudly, not skip the sync behind a warn().
assert(
  /this\.logger\.error\(/.test(code),
  `${SERVICE}: a missing ORDERS_SERVICE_TOKEN must log at error level, not warn`,
);

// ESO does not prune: the key leaves the K8s Secret only when the data entry goes.
assert(
  !/^\s*-\s*secretKey:\s*JWT_TOKEN\s*$/m.test(externalSecret),
  `${EXTERNAL_SECRET}: JWT_TOKEN data entry must stay removed — ESO does not prune, `
    + 'so re-adding it puts the shared value back into the K8s Secret',
);

console.log('verify-orders-token-chain-contract: all checks passed');
