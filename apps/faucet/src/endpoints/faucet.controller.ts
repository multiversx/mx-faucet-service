import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ClientIp } from './helpers';
import { Jwt, JwtOrNativeAuthGuard } from '@multiversx/sdk-nestjs-auth';
import { FaucetService } from './faucet.service';

@Controller()
export class FaucetController {
  constructor(
    private readonly faucetService: FaucetService,
  ) { }

  @Post('/faucet')
  @UseGuards(JwtOrNativeAuthGuard)
  async retrieveFunds(
    @Jwt('address') address: string,
    @ClientIp() clientIp: string,
    @Body() body: any,
  ): Promise<any> {
    if (!this.faucetService.isFaucetEnabled()) {
      throw new HttpException('Faucet not enabled', HttpStatus.NOT_FOUND);
    }

    let captcha;
    if (!this.faucetService.shouldBypassCaptchaCheck()) {
      captcha = body.captcha;
      if (!captcha) {
        throw new BadRequestException('Captcha not provided');
      }
    }

    const success = await this.faucetService.retrieveFunds(address, undefined, clientIp, captcha);
    if (!success) {
      throw new HttpException('Funds already received', HttpStatus.TOO_MANY_REQUESTS);
    }

    return {
      status: 'success',
    };
  }

  @Get('/faucet/settings')
  getFaucetSettings() {
    return this.faucetService.getSettings();
  }
}
