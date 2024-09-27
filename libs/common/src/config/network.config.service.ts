import { Injectable } from '@nestjs/common';
import { configuration } from './configuration';

export interface NetworkConfig {
  chainID: string;
}

@Injectable()
export class NetworkConfigService {
  private readonly devnetConfig: NetworkConfig = {
    chainID: 'D',
  };
  private readonly testnetConfig: NetworkConfig = {
    chainID: 'T',
  };
  private readonly mainnetConfig: NetworkConfig = {
    chainID: '1',
  };
  private readonly customConfig: NetworkConfig = {
    chainID: 'T',
  };

  public readonly config: NetworkConfig;

  constructor() {
    const network = configuration().libs.common.network;

    const networkConfigs = {
      devnet: this.devnetConfig,
      testnet: this.testnetConfig,
      mainnet: this.mainnetConfig,
      custom: this.customConfig,
    };

    this.config = networkConfigs[network];
  }
}
