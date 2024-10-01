import { Module } from '@nestjs/common';
import { DynamicModuleUtils } from '@libs/common';
import { FaucetModule } from './faucet/faucet.module';

@Module({
  imports: [
    DynamicModuleUtils.getApiModule(),
    DynamicModuleUtils.getCachingModule(),
    FaucetModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
})

export class EndpointsModule {}
