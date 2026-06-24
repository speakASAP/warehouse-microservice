import { Module } from '@nestjs/common';
import { JwtRolesGuard } from './jwt-roles.guard';

@Module({
  providers: [JwtRolesGuard],
  exports: [JwtRolesGuard],
})
export class AuthModule {}
