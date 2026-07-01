import 'reflect-metadata';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { JwtRolesGuard } from '../src/auth/jwt-roles.guard';
import { PUBLIC_KEY, ROLES_KEY } from '../src/auth/roles.decorator';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

function createContext(request: any = { headers: {} }): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: () => request,
    })),
  } as any;
}

function createGuard(options: { isPublic?: boolean; roles?: string[] } = {}): JwtRolesGuard {
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === PUBLIC_KEY) return options.isPublic ?? false;
      if (key === ROLES_KEY && options.roles) return { roles: options.roles };
      return undefined;
    }),
  };

  return new JwtRolesGuard(reflector as any);
}

describe('JwtRolesGuard central Auth validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.AUTH_SERVICE_URL;
    delete process.env.AUTH_VALIDATE_TIMEOUT_MS;
    delete process.env.SERVICE_NAME;
    delete process.env.CLIPLOT_WAREHOUSE_SERVICE_TOKEN;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('allows public routes without validating a bearer token', async () => {
    const guard = createGuard({ isPublic: true });

    await expect(guard.canActivate(createContext())).resolves.toBe(true);

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('fails closed when the Authorization header is missing', async () => {
    const guard = createGuard();

    await expect(guard.canActivate(createContext())).rejects.toThrow(UnauthorizedException);

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('validates a user bearer token with Auth and preserves full roles on request.user', async () => {
    process.env.AUTH_SERVICE_URL = 'http://auth-service.internal/';
    process.env.AUTH_VALIDATE_TIMEOUT_MS = '1500';
    const request: any = { headers: { authorization: 'Bearer user-token' } };
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        valid: true,
        user: {
          id: 'auth-user-id',
          sub: 'auth-subject',
          email: 'operator@example.com',
          type: 'staff',
          auth_method: 'hosted',
          roles: ['global:superadmin', 'warehouse:viewer'],
        },
      },
    } as any);

    const guard = createGuard({ roles: ['global:superadmin'] });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://auth-service.internal/auth/validate',
      { token: 'user-token' },
      { timeout: 1500 },
    );
    expect(request).toMatchObject({
      user: {
        sub: 'auth-subject',
        email: 'operator@example.com',
        type: 'staff',
        authMethod: 'hosted',
        roles: ['global:superadmin', 'warehouse:viewer'],
      },
    });
    expect((request as any).serviceActor).toBeUndefined();
  });

  it('uses Auth user id as request subject when sub is absent', async () => {
    const request: any = { headers: { authorization: 'Bearer user-token' } };
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        valid: true,
        user: {
          id: 'auth-user-id',
          roles: ['global:superadmin'],
        },
      },
    } as any);

    const guard = createGuard({ roles: ['global:superadmin'] });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(request.user.sub).toBe('auth-user-id');
  });

  it('accepts an Auth-issued Catalog service principal with the Warehouse admin role', async () => {
    const request = { headers: { authorization: 'Bearer catalog-warehouse-token' } };
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        valid: true,
        user: {
          sub: 'catalog-warehouse-service',
          type: 'service',
          authMethod: 'auth-service-jwt',
          roles: ['internal:warehouse-microservice:admin'],
          serviceName: 'catalog-microservice',
          service: 'catalog-microservice',
          clientId: 'catalog-microservice',
        },
      },
    } as any);

    const guard = createGuard();

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://auth-microservice:3370/auth/validate',
      { token: 'catalog-warehouse-token' },
      { timeout: 3000 },
    );
    expect(request).toMatchObject({
      user: {
        sub: 'catalog-warehouse-service',
        type: 'service',
        authMethod: 'auth-service-jwt',
        roles: ['internal:warehouse-microservice:admin'],
        service: 'catalog-microservice',
        serviceName: 'catalog-microservice',
        clientId: 'catalog-microservice',
      },
      serviceActor: {
        sub: 'catalog-warehouse-service',
        type: 'service',
        authMethod: 'auth-service-jwt',
        roles: ['internal:warehouse-microservice:admin'],
        service: 'catalog-microservice',
        serviceName: 'catalog-microservice',
        clientId: 'catalog-microservice',
      },
    });
  });

  it('accepts the Cliplot static warehouse service token as a machine actor', async () => {
    process.env.CLIPLOT_WAREHOUSE_SERVICE_TOKEN = 'cliplot-warehouse-token';
    const request = { headers: { authorization: 'Bearer cliplot-warehouse-token' } };

    const guard = createGuard();

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(request).toMatchObject({
      user: {
        sub: 'cliplot-service',
        type: 'service',
        authMethod: 'warehouse-static-service-token',
        roles: ['internal:warehouse-microservice:admin'],
        service: 'cliplot-service',
        serviceName: 'cliplot-service',
        clientId: 'cliplot-service',
      },
      serviceActor: {
        sub: 'cliplot-service',
        type: 'service',
        authMethod: 'warehouse-static-service-token',
        roles: ['internal:warehouse-microservice:admin'],
        service: 'cliplot-service',
        serviceName: 'cliplot-service',
        clientId: 'cliplot-service',
      },
    });
  });

  it('does not treat a mismatched Cliplot static token as authenticated', async () => {
    process.env.CLIPLOT_WAREHOUSE_SERVICE_TOKEN = 'cliplot-warehouse-token';
    const request = { headers: { authorization: 'Bearer wrong-cliplot-token' } };
    mockedAxios.post.mockResolvedValueOnce({ data: { valid: false } } as any);

    const guard = createGuard();

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(UnauthorizedException);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://auth-microservice:3370/auth/validate',
      { token: 'wrong-cliplot-token' },
      { timeout: 3000 },
    );
  });

  it('preserves service identity fields returned by central Auth validation', async () => {
    const request = { headers: { authorization: 'Bearer service-token' } };
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        valid: true,
        user: {
          sub: 'runtime-subject',
          roles: ['internal:warehouse-microservice:admin'],
          service: 'orders-microservice',
          serviceName: 'orders-microservice',
          client_id: 'orders-client',
        },
      },
    } as any);

    const guard = createGuard();

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(request).toMatchObject({
      user: {
        sub: 'runtime-subject',
        roles: ['internal:warehouse-microservice:admin'],
        type: undefined,
        authMethod: 'auth-validate',
        service: 'orders-microservice',
        serviceName: 'orders-microservice',
        clientId: 'orders-client',
      },
      serviceActor: {
        sub: 'runtime-subject',
        roles: ['internal:warehouse-microservice:admin'],
        type: 'service',
        authMethod: 'auth-validate',
        service: 'orders-microservice',
        serviceName: 'orders-microservice',
        clientId: 'orders-client',
      },
    });
  });

  it('preserves existing forbidden response when Auth validates a token without required roles', async () => {
    const request = { headers: { authorization: 'Bearer wrong-role-token' } };
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        valid: true,
        user: {
          sub: 'auth-user-id',
          roles: ['warehouse:viewer'],
        },
      },
    } as any);

    const guard = createGuard({ roles: ['global:superadmin'] });

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(ForbiddenException);
  });

  it('fails closed when Auth returns a non-valid response', async () => {
    const request = { headers: { authorization: 'Bearer invalid-token' } };
    mockedAxios.post.mockResolvedValueOnce({ data: { valid: false } } as any);
    const guard = createGuard({ roles: ['global:superadmin'] });

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(UnauthorizedException);
  });

  it('fails closed when Auth validation errors or times out', async () => {
    const request = { headers: { authorization: 'Bearer timeout-token' } };
    mockedAxios.post.mockRejectedValueOnce(new Error('timeout'));
    const guard = createGuard({ roles: ['global:superadmin'] });

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(UnauthorizedException);
  });
});
