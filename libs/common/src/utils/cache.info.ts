import { Constants } from "@multiversx/sdk-nestjs-common";

export class CacheInfo {
  key: string = "";
  ttl: number = Constants.oneSecond() * 6;

  static LastProcessedNonce(shardId: number): CacheInfo {
    return {
      key: `lastProcessedNonce:${shardId}`,
      ttl: Constants.oneMonth(),
    };
  }

  static Examples: CacheInfo = {
    key: "examples",
    ttl: Constants.oneHour(),
  };

  static FaucetAddress(address: string): CacheInfo {
    return {
      key: `faucet:${address}`,
      ttl: Constants.oneHour(),
    };
  }

  static FaucetNonce: CacheInfo = {
    key: "faucetNonce",
    ttl: Constants.oneMonth(),
  };
}
