import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

export interface AuthenticatedRequestUser {
  sub?: string;
  email?: string;
  type?: string;
  authMethod?: string;
  roles?: string[];
  service?: string;
  serviceName?: string;
  clientId?: string;
}

export type RequestWithAuthenticatedUser = Request & {
  user?: AuthenticatedRequestUser;
  serviceActor?: AuthenticatedRequestUser;
};

export function getAuthenticatedMutationActor(request: Request): string {
  const user = (request as RequestWithAuthenticatedUser).user;
  if (!user) {
    throw new UnauthorizedException('Authenticated user context is required');
  }

  const serviceName = normalizeClaim(user.serviceName) ?? normalizeClaim(user.service) ?? normalizeClaim(user.clientId);
  if (serviceName) {
    return `service:${serviceName}`;
  }

  const subject = normalizeClaim(user.sub);
  if (!subject) {
    throw new UnauthorizedException('Authenticated subject is required');
  }

  const actorType = normalizeClaim(user.type) ?? 'user';
  return `auth:${actorType}:${subject}`;
}

function normalizeClaim(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
