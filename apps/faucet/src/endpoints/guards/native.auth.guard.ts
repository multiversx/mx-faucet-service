import { NativeAuthServer } from '@multiversx/sdk-native-auth-server';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { CommonConfigService } from '@libs/common';
import { ImpersonateService } from '../impersonate/impersonate.service';

@Injectable()
export class NativeAuthGuard implements CanActivate {
  private readonly logger = new Logger(NativeAuthGuard.name);
  private readonly authServer: NativeAuthServer;

  constructor(apiConfigService: CommonConfigService, cachingService: CacheService, impersonateService: ImpersonateService) {
    this.authServer = new NativeAuthServer({
      apiUrl: apiConfigService.config.urls.api,
      maxExpirySeconds: 86400,
      acceptedOrigins: [
        'https://api.multiversx.com',
      ],
      isOriginAccepted: () => true, // we accept any origin (may be subject to change in the future)
      validateImpersonateCallback: async (signerAddress, impersonateAddress) => {
        return await impersonateService.isImpersonateAllowed(signerAddress, impersonateAddress);
      },
      cache: {
        getValue: async function <T>(key: string): Promise<T | undefined> {
          if (key === 'block:timestamp:latest') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new Date().getTime() / 1000;
          }

          return await cachingService.get<T>(key);
        },
        setValue: async function <T>(key: string, value: T, ttl: number): Promise<void> {
          await cachingService.set(key, value, ttl);
        },
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization: string = request.headers['authorization'];
    if (!authorization) {
      return false;
    }
    const jwt = authorization.replace('Bearer ', '');

    try {
      const userInfo = await this.authServer.validate(jwt);

      request.res.set('X-Native-Auth-Issued', userInfo.issued);
      request.res.set('X-Native-Auth-Expires', userInfo.expires);
      request.res.set('X-Native-Auth-Address', userInfo.address);
      request.res.set('X-Native-Auth-Timestamp', Math.round(new Date().getTime() / 1000));

      request.nativeAuth = userInfo;
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }
}
