/**
 * JWT Roles Guard - validates Bearer JWT and enforces roles from payload.roles.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { RequestWithAuthenticatedUser } from './authenticated-actor';
import { ROLES_KEY, PUBLIC_KEY } from './roles.decorator';

@Injectable()
export class JwtRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

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
    const requiredRoles = rolesMetadata?.roles?.length ? rolesMetadata.roles : this.getDefaultRoles();

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);
    try {
      const payload = this.jwtService.verify<{
        sub?: string;
        email?: string;
        type?: string;
        auth_method?: string;
        roles?: string[];
        service?: string;
        serviceName?: string;
        clientId?: string;
        client_id?: string;
      }>(token, {
        secret: process.env.JWT_SECRET,
      });
      const userRoles: string[] = Array.isArray(payload.roles) ? payload.roles : [];

      const hasRole = requiredRoles.some((r) => userRoles.includes(r));
      if (!hasRole) {
        throw new ForbiddenException('Insufficient permissions');
      }

      (request as RequestWithAuthenticatedUser).user = {
        sub: payload.sub,
        email: payload.email,
        type: payload.type,
        authMethod: payload.auth_method,
        roles: userRoles,
        service: payload.service,
        serviceName: payload.serviceName,
        clientId: payload.clientId ?? payload.client_id,
      };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException || err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Invalid token');
    }
  }

  private getDefaultRoles(): string[] {
    const name = process.env.SERVICE_NAME || 'warehouse-microservice';
    return [`global:superadmin`, `internal:${name}:admin`];
  }
}
