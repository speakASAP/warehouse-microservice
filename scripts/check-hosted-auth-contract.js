const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const html = read('public/admin/index.html');
const app = read('public/admin/app.js');
const authGuard = read('src/auth/jwt-roles.guard.ts');
const authModule = read('src/auth/auth.module.ts');
const inventory = read('docs/orchestrator/2026-06-24-aos-auth-static-inventory.md');

function has(source, pattern, label) {
  assert.match(source, pattern, label);
  console.log(`PASS ${label}`);
}

function lacks(source, pattern, label) {
  assert.doesNotMatch(source, pattern, label);
  console.log(`PASS ${label}`);
}

has(html, /data-auth-hosted="login"/, 'admin login uses hosted Auth button');
has(html, /data-auth-hosted="register"/, 'admin register uses hosted Auth button');
lacks(html, /type="password"/, 'admin HTML has no password input');
lacks(html, /id="loginForm"|id="registerForm"/, 'admin HTML has no local credential forms');

has(app, /defaultAuthBase = 'https:\/\/auth\.alfares\.cz'/, 'hosted Auth base URL');
has(app, /authClientId = 'warehouse-microservice'/, 'client_id=warehouse-microservice');
has(app, /hostedAuthUrl\(path\)/, 'hosted Auth URL builder exists');
has(app, /url\.searchParams\.set\('client_id', authClientId\)/, 'hosted URL sets client_id');
has(app, /url\.searchParams\.set\('return_url', returnUrl\.toString\(\)\)/, 'hosted URL sets return_url');
has(app, /url\.searchParams\.set\('state', nonce\)/, 'hosted URL sets state');
has(app, /url\.searchParams\.set\('lang', 'cs'\)/, 'hosted URL sets lang');
has(app, /sessionStorage\.setItem\(storage\.authState, nonce\)/, 'state is stored before redirect');
has(app, /consumeHostedAuthFragment\(\)/, 'callback fragment consumer is invoked');
has(app, /window\.location\.hash\.includes\('access_token='\)/, 'callback reads access_token fragment');
has(app, /params\.get\('access_token'\)/, 'callback extracts access_token');
has(app, /params\.get\('state'\)/, 'callback extracts returned state');
has(app, /sessionStorage\.getItem\(storage\.authState\)/, 'callback reads expected state');
has(app, /returnedState !== expectedState/, 'callback rejects state mismatch');
has(app, /window\.history\.replaceState\(null, document\.title, cleanUrl\)/, 'callback strips URL fragment');
has(app, /sessionStorage\.setItem\(storage\.token, state\.token\)/, 'token uses transitional sessionStorage');
has(app, /localStorage\.removeItem\(storage\.token\)/, 'legacy localStorage token is removed');
has(app, /Authorization: `Bearer \$\{state\.token\}`/, 'existing API calls still use bearer auth');

lacks(app, /authRequest\(|submitAuthForm\(|fetch\(`\$\{state\.authBase\}\/\$\{path\}`/, 'no local credential POST to Auth JSON API');
lacks(app, /localStorage\.setItem\(storage\.token/, 'no localStorage access-token writes remain');
lacks(app, /localStorage\.setItem\(storage\.refreshToken/, 'no localStorage refresh-token writes remain');

has(authGuard, /AUTH_SERVICE_URL/, 'guard uses configurable AUTH_SERVICE_URL');
has(authGuard, /DEFAULT_AUTH_SERVICE_URL = 'http:\/\/auth-microservice:3370'/, 'guard has Kubernetes-safe Auth service default');
has(authGuard, /axios\.post<AuthValidationResponse>\(/, 'guard posts to central Auth validation');
has(authGuard, /\/auth\/validate/, 'guard targets Auth /auth/validate');
has(authGuard, /\{ token \}/, 'guard sends bearer token in validation body');
has(authGuard, /response\.data\?\.valid !== true \|\| !response\.data\.user/, 'guard fails closed on non-valid Auth response');
has(authGuard, /throw new UnauthorizedException\('Invalid token'\)/, 'guard maps Auth validation failures to 401');
has(authGuard, /roles: userRoles/, 'guard preserves full roles on request user');
has(authGuard, /clientId: authUser\.clientId \?\? authUser\.client_id/, 'guard preserves service client identity variants');
has(authGuard, /authenticatedRequest\.serviceActor = \{/, 'guard attaches explicit service actor for Auth-validated service tokens');
has(authGuard, /type: 'service'/, 'guard marks service actor type');
has(authGuard, /authMethod: requestUser\.authMethod \|\| 'auth-validate'/, 'guard marks service actor auth method');
lacks(authGuard, /JwtService|jwtService\.verify|JWT_SECRET|JwtModule/, 'guard does not locally verify JWTs');
lacks(authGuard, /console\.(log|warn|error)|Logger/, 'guard does not log tokens or validation failures');
lacks(authModule, /JwtModule|JWT_SECRET|@nestjs\/jwt/, 'auth module does not wire local JWT verification');

has(inventory, /Admin Hosted Auth Slice/, 'inventory records hosted Auth slice');
has(inventory, /Backend Auth Validate Slice/, 'inventory records backend Auth validate slice');
has(inventory, /Warehouse Auth-Validated Service Actor Slice/, 'inventory records service actor slice');
has(inventory, /`POST \/auth\/validate`/, 'inventory records central Auth validation endpoint');
has(inventory, /local-JWT validation debt is removed/, 'inventory reclassifies local-JWT debt as removed');
has(inventory, /HOSTED_AUTH_CONSUMER_STANDARD\.md/, 'inventory references central hosted Auth standard');

console.log('Warehouse hosted Auth static contract check passed.');
