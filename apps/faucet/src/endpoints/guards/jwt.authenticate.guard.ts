import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { decode, verify } from 'jsonwebtoken';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class JwtAuthenticateGuard implements CanActivate {

  constructor(
    private readonly apiConfigService: AppConfigService,
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization: string = request.headers['authorization'];
    if (!authorization) {
      return false;
    }

    const jwt = authorization.replace('Bearer ', '');

    try {
      const jwtSecret = this.apiConfigService.config.jwtSecret;

      request.jwt = await new Promise((resolve, reject) => {
        verify(jwt, jwtSecret, (err, decoded) => {
          if (err) {
            const decodedJwt: any = decode(jwt);
            if (decodedJwt) {
              reject({
                decodedJwt,
                // @ts-ignore
                expiredAt: err.expiredAt,
              });
            } else {
              reject(err);
            }
          }

          // @ts-ignore
          resolve(decoded.user);
        });
      });

    } catch (error) {
      return false;
    }

    return true;
  }
}
