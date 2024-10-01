import { Global, Module } from '@nestjs/common';
import { DynamicModuleUtils } from '@libs/common';

@Global()
@Module({
  imports: [
    DynamicModuleUtils.getCachingModule(),
  ],
  providers: [],
  exports: [],
})

export class ServicesModule {}
