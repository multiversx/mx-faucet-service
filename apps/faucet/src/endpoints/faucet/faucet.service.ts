import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Account, Address, Transaction, TransactionPayload } from '@multiversx/sdk-core';
import { Mnemonic, UserSigner } from '@multiversx/sdk-wallet';
import { FaucetSettings } from './entities/faucet.settings';
import { NetworkConfig, ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import qs from 'qs';
import { readFileSync } from 'fs';
import { UserSecretKey } from '@multiversx/sdk-wallet/out';
import { ApiService } from '@multiversx/sdk-nestjs-http';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from '@libs/common';
import { AddressUtils, Constants } from '@multiversx/sdk-nestjs-common';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class FaucetService {
  private readonly logger: Logger;

  private networkConfig?: NetworkConfig;

  provider?: ProxyNetworkProvider;
  faucetAccount?: Account;
  faucetAddress: string = '';
  signer?: UserSigner;

  constructor(
    private readonly cachingService: CacheService,
    private readonly apiConfigService: AppConfigService,
    private readonly apiService: ApiService,
  ) {
    this.logger = new Logger(FaucetService.name);

    if (this.isFaucetEnabled()) {
      this.provider = new ProxyNetworkProvider(this.apiConfigService.config.gatewayUrl);
      const privateKeyMode = this.apiConfigService.config.faucetPrivateKeyMode;
      let secretKey;
      if (privateKeyMode === 'mnemonic') {
        secretKey = Mnemonic.fromString(this.apiConfigService.config.faucetMnemonic).deriveKey();
      } else { // pem file
        const pemContent = readFileSync(this.apiConfigService.config.faucetPemPath);
        secretKey = UserSecretKey.fromPem(pemContent.toString(), this.apiConfigService.config.faucetPemIndex ?? 0);
      }
      this.signer = new UserSigner(secretKey);
      this.faucetAddress = this.signer.getAddress().bech32();
      this.faucetAccount = new Account(new Address(this.faucetAddress));
    }
  }

  isFaucetEnabled(): boolean {
    if (!this.faucetAccount) {
      return false;
    }
    const faucetAddress = this.faucetAccount.address.bech32();

    return faucetAddress !== undefined && faucetAddress !== null && faucetAddress !== '';
  }

  shouldBypassCaptchaCheck(): boolean {
    return this.apiConfigService.config.faucetRecaptchaBypass;
  }

  private async getNetworkConfig() {
    if (!this.networkConfig) {
      this.networkConfig = await this.provider?.getNetworkConfig();
    }

    return this.networkConfig;
  }

  async retrieveFunds(address: string, nonce: number | undefined, clientIp: string, captcha: string): Promise<boolean> {
    if (!this.isFaucetEnabled()) {
      throw new Error('Faucet not enabled');
    }

    if (!this.signer) {
      throw new Error('No signer initialized');
    }

    if (!this.provider) {
      throw new Error('No provider initialized');
    }

    if (!AddressUtils.isAddressValid(address)) {
      throw new Error('Invalid bech32 address');
    }

    const networkConfig = await this.getNetworkConfig();
    if (!networkConfig) {
      throw new Error('Network config could not be fetched');
    }

    if (!this.shouldBypassCaptchaCheck() && captcha) {
      const success = await this.validateRecaptcha(captcha, clientIp);
      if (!success) {
        throw new BadRequestException('Failed captcha check');
      }
    }

    if (address !== this.faucetAddress) {
      const isAddressUsed = await this.cachingService.get(CacheInfo.FaucetAddress(address).key);
      if (isAddressUsed) {
        return false;
      }
    }

    const tx = new Transaction({
      chainID: networkConfig.ChainID,
      gasLimit: networkConfig.MinGasLimit,
      gasPrice: networkConfig.MinGasPrice,
      receiver: new Address(address),
      value: this.apiConfigService.config.faucetAmount,
      sender: new Address(this.faucetAddress),
    });

    const txNonce = nonce ?? await this.getNonce();

    this.logger.log(`Sending faucet xEGLD to address '${address}' with nonce '${txNonce}', ip '${clientIp}', chain ID '${networkConfig.ChainID.valueOf()}', captcha '${captcha}'`);

    tx.setNonce(txNonce);

    const signature = await this.signer.sign(tx.serializeForSigning());
    tx.applySignature(signature);

    await this.provider.sendTransaction(tx);

    const faucetToken = this.apiConfigService.config.faucetToken;
    if (faucetToken && nonce === undefined) {
      const tx2 = this.getTransaction(address, faucetToken, networkConfig);

      const nonce2 = await this.getNonce();
      tx2.setNonce(nonce2);

      this.logger.log(`Sending faucet token to address '${address}' with nonce '${nonce2}', ip '${clientIp}'`);

      const signature2 = await this.signer.sign(tx2.serializeForSigning());
      tx2.applySignature(signature2);

      await this.provider.sendTransaction(tx2);
    }

    await this.cachingService.set(
      CacheInfo.FaucetAddress(address).key,
      true,
      Constants.oneSecond() * this.apiConfigService.config.faucetCooldownSameAddressInSec,
    );

    return true;
  }

  private getTransaction(address: string, faucetToken: string, networkConfig: NetworkConfig): Transaction {
    const tokenHex = this.padHex(Buffer.from(faucetToken.split('-').slice(0, 2).join('-'), 'ascii').toString('hex'));
    const tokenAmountHex = this.padHex(BigInt(this.apiConfigService.config.faucetTokenAmount).toString(16));

    const isNft = faucetToken.split('-').length === 3;
    let dataField = new TransactionPayload(`ESDTTransfer@${tokenHex}@${tokenAmountHex}`);
    let receiverAddress = address;

    if (isNft) {
      const tokenNonceHex = faucetToken.split('-')[2];
      dataField = new TransactionPayload(`ESDTNFTTransfer@${tokenHex}@${tokenNonceHex}@${tokenAmountHex}@${new Address(address).hex()}`);
      receiverAddress = this.faucetAddress;
    }

    return new Transaction({
      chainID: networkConfig.ChainID,
      gasPrice: networkConfig.MinGasPrice,
      gasLimit: 500000,
      receiver: new Address(receiverAddress),
      data: dataField,
      sender: new Address(this.faucetAddress),
    });
  }

  private async getNonce(): Promise<number> {
    const value = await this.cachingService.get(CacheInfo.FaucetNonce.key);
    if (!value && value !== 0) {
      const accountNonce = await this.getLatestNonce();

      await this.cachingService.set(CacheInfo.FaucetNonce.key, accountNonce, CacheInfo.FaucetNonce.ttl);

      return accountNonce;
    }

    return await this.cachingService.incrementRemote(CacheInfo.FaucetNonce.key);
  }

  async getLatestNonce(): Promise<number> {
    if (!this.faucetAccount) {
      throw new Error('No faucet account initialized');
    }

    if (!this.provider) {
      throw new Error('No provider initialized');
    }

    const account = await this.provider.getAccount(this.faucetAccount.address);
    this.faucetAccount.update(account);

    return this.faucetAccount.nonce.valueOf();
  }

  private padHex(value: string): string {
    return (value.length % 2 ? '0' + value : value);
  }

  getSettings(): FaucetSettings {
    const faucetToken = this.apiConfigService.config.faucetToken;

    return {
      address: this.faucetAddress,
      amount: this.apiConfigService.config.faucetAmount,
      token: faucetToken ? faucetToken.split('-').slice(0, 2).join('-') : undefined,
      tokenAmount: this.apiConfigService.config.faucetTokenAmount ? this.apiConfigService.config.faucetTokenAmount : undefined,
      recaptchaBypass: this.shouldBypassCaptchaCheck(),
    };
  }

  private async validateRecaptcha(recaptcha: string, clientIp: string | undefined): Promise<boolean> {
    try {
      const result = await this.apiService.post('https://www.google.com/recaptcha/api/siteverify', qs.stringify({
        secret: this.apiConfigService.config.faucetRecaptchaSecret,
        response: recaptcha,
        remoteip: clientIp,
      }));

      return result?.data?.success ?? false;
    } catch (error) {
      return false;
    }
  }
}
