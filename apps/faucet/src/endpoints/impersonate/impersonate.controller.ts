import { Controller, ForbiddenException, Get, Param } from "@nestjs/common";
import { ImpersonateService } from "./impersonate.service";

@Controller('/impersonate')
export class ImpersonateController {
  constructor(
    private readonly impersonateService: ImpersonateService,
  ) { }

  @Get('allowed/:address/:impersonator')
  async isImpersonateAllowed(
    @Param('address') address: string,
    @Param('impersonator') impersonator: string,
  ): Promise<boolean> {
    const isAllowed = await this.impersonateService.isImpersonateAllowed(address, impersonator);
    if (!isAllowed) {
      throw new ForbiddenException();
    }

    return isAllowed;
  }
}
