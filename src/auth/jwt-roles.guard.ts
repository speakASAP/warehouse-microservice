/**
 * JWT Roles Guard - validates Bearer tokens with central Auth and enforces roles.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import axios from 'axios';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { RequestWithAuthenticatedUser } from './authenticated-actor';
import { ROLES_KEY, PUBLIC_KEY } from './roles.decorator';

type AuthValidationUser = {
  id?: string;
  sub?: string;
  email?: string;
  type?: string;
  auth_method?: string;
  authMethod?: string;
  roles?: string[];
  service?: string;
  serviceName?: string;
  clientId?: string;
  client_id?: string;
};

type AuthValidationResponse = {
  valid?: boolean;
  user?: AuthValidationUser;
};

const DEFAULT_AUTH_SERVICE_URL = 'http://auth-microservice:3370';
const DEFAULT_AUTH_VALIDATE_TIMEOUT_MS = 3000;

@Injectable()
export class JwtRolesGuard implements CanActivate {
  private readonly logger = new Logger(JwtRolesGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const rolesMetadata = this.reflector.getAllAndOverride<{ roles: string[] }>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Deny by default. An undecorated route used to fall back to the service's
    // broadest role set, which silently granted stock-mutation rights to callers
    // that only ever needed to read. Failing loudly here forces every new route
    // to declare its own least-privilege role set.
    if (!rolesMetadata?.roles?.length) {
      const handler = context.getHandler()?.name ?? 'unknown';
      const controller = context.getClass()?.name ?? 'unknown';
      this.logger.error(
        `Route ${controller}.${handler} has no @Roles decorator; denying request. ` +
          `Decorate it with a constant from src/auth/roles.constants.ts.`,
      );
      throw new ForbiddenException('Route is missing an authorization policy');
    }

    const requiredRoles = rolesMetadata.roles;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);
    const staticServiceActor = this.resolveStaticServiceActor(token);
    const authUser = staticServiceActor ?? (await this.validateWithAuthService(token));
    const userRoles = Array.isArray(authUser.roles) ? authUser.roles : [];

    const hasRole = requiredRoles.some((r) => userRoles.includes(r));
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const requestUser = {
      sub: authUser.sub ?? authUser.id,
      email: authUser.email,
      type: authUser.type,
      authMethod: authUser.authMethod ?? authUser.auth_method ?? 'auth-validate',
      roles: userRoles,
      service: authUser.service,
      serviceName: authUser.serviceName,
      clientId: authUser.clientId ?? authUser.client_id,
    };
    const authenticatedRequest = request as RequestWithAuthenticatedUser;
    authenticatedRequest.user = requestUser;

    if (requestUser.serviceName || requestUser.service || requestUser.clientId) {
      authenticatedRequest.serviceActor = {
        ...requestUser,
        type: 'service',
        authMethod: requestUser.authMethod || 'auth-validate',
      };
    }
    return true;
  }

  /**
   * Legacy shared-secret bypass. This credential is a static string held by more
   * than one pod and is not revocable through Auth, so it is scoped to read-only
   * rather than admin. Slated for replacement by a per-pair RS256 service JWT;
   * see docs/RS256_SERVICE_TOKEN_MIGRATION_PLAN.md.
   */
  private resolveStaticServiceActor(token: string): AuthValidationUser | null {
    // Warehouse's own scheduled maintenance identity, used by the
    // reservation-expiry CronJob. Separate from any caller's credential so that
    // restricting an external token cannot disable internal maintenance.
    const maintenanceToken = process.env.WAREHOUSE_MAINTENANCE_TOKEN;
    if (maintenanceToken && this.safeEqual(token, maintenanceToken)) {
      return {
        sub: 'warehouse-maintenance',
        type: 'service',
        authMethod: 'warehouse-maintenance-token',
        roles: ['internal:warehouse-microservice:maintenance'],
        service: 'warehouse-microservice',
        serviceName: 'warehouse-microservice',
        clientId: 'warehouse-maintenance',
      };
    }

    const cliplotToken = process.env.CLIPLOT_WAREHOUSE_SERVICE_TOKEN;
    if (cliplotToken && this.safeEqual(token, cliplotToken)) {
      this.logger.warn(
        'Request authenticated with the legacy static cliplot warehouse token; ' +
          'this credential is shared and unrevocable, and is restricted to read-only routes.',
      );
      return {
        sub: 'cliplot',
        type: 'service',
        authMethod: 'warehouse-static-service-token',
        roles: ['internal:warehouse-microservice:readonly'],
        service: 'cliplot',
        serviceName: 'cliplot',
        clientId: 'cliplot',
      };
    }

    return null;
  }

  private async validateWithAuthService(token: string): Promise<AuthValidationUser> {
    try {
      const response = await axios.post<AuthValidationResponse>(
        `${this.getAuthServiceUrl()}/auth/validate`,
        { token },
        { timeout: this.getAuthValidateTimeoutMs() },
      );

      if (response.data?.valid !== true || !response.data.user) {
        throw new UnauthorizedException('Invalid token');
      }

      return response.data.user;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid token');
    }
  }

  private getAuthServiceUrl(): string {
    return (process.env.AUTH_SERVICE_URL || DEFAULT_AUTH_SERVICE_URL).replace(/\/+$/, '');
  }

  private getAuthValidateTimeoutMs(): number {
    const configured = Number(process.env.AUTH_VALIDATE_TIMEOUT_MS);
    return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_AUTH_VALIDATE_TIMEOUT_MS;
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }
    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}
