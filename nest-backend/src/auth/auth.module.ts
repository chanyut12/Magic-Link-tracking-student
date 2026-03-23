import { Module, Global } from '@nestjs/common';
import { PasswordService } from './password.service';
import { DatabaseModule } from '../database/database.module';
import {
  AuthGuard,
  OptionalAuthGuard,
  PermissionsGuard,
  RolesGuard,
} from './auth.guard';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    PasswordService,
    AuthGuard,
    PermissionsGuard,
    RolesGuard,
    OptionalAuthGuard,
  ],
  exports: [
    PasswordService,
    AuthGuard,
    PermissionsGuard,
    RolesGuard,
    OptionalAuthGuard,
  ],
})
export class AuthModule {}
