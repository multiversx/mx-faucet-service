import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "@libs/common";
import { ExampleModule } from "./example/example.module";

@Module({
  imports: [
    ExampleModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
})
export class EndpointsModule { }
