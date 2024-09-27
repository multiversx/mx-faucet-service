import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CommonConfigService } from '@libs/common';

@Injectable()
export class JwtAdminGuard implements CanActivate {
  constructor(
    private readonly commonConfigService: CommonConfigService
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const jwt = request.jwt ?? request.nativeAuth;

    const admins = this.commonConfigService.config.security.admins;
    if (!admins) {
      return false;
    }

    return admins.includes(jwt.address);
  }
}
