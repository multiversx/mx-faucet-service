import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthenticateGuard } from './jwt.authenticate.guard';
import { NativeAuthGuard } from './native.auth.guard';
import { AppConfigService } from '../../config/app-config.service';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { ImpersonateService } from '../impersonate/impersonate.service';
import { CommonConfigService } from '@libs/common';

@Injectable()
export class JwtOrNativeAuthGuard implements CanActivate {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly commonConfigService: CommonConfigService,
    private readonly cachingService: CacheService,
    private readonly impersonateService: ImpersonateService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtGuard = new JwtAuthenticateGuard(this.appConfigService);
    const nativeAuthGuard = new NativeAuthGuard(this.commonConfigService, this.cachingService, this.impersonateService);

    const guards = [jwtGuard, nativeAuthGuard];

    const canActivateResponses = await Promise.all(guards.map(async guard => {
      try {
        return await guard.canActivate(context);
      } catch {
        return false;
      }
    }));

    return canActivateResponses.reduce((result, value) => result || value, false);
  }
}
