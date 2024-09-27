import { Module } from '@nestjs/common';
import { FaucetController } from './faucet.controller';
import { CacheModule } from '@multiversx/sdk-nestjs-cache';
import { DynamicModuleUtils } from '@libs/common';
import { FaucetService } from './faucet.service';
import { ApiModule } from '@multiversx/sdk-nestjs-http';
import { NativeAuthGuard } from '@multiversx/sdk-nestjs-auth';

@Module({
  imports: [
    ApiModule,
    CacheModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
    NativeAuthGuard,
    FaucetService,
  ],
  controllers: [
    FaucetController,
  ],
  exports: [
    FaucetService,
  ],
})

export class FaucetModule {}
