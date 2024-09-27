import { Address } from "@multiversx/sdk-core/out";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ImpersonateService {
  async isImpersonateAllowed(address: string, impersonator: string): Promise<boolean> {
    if (!this.isAddress(address)) {
      return false;
    }

    if (!this.isAddress(impersonator)) {
      return false;
    }

    return new Address(impersonator).isContractAddress();
  }

  private isAddress(address: string): boolean {
    try {
      new Address(address);
      return true;
    } catch (error) {
      return false;
    }
  }
}