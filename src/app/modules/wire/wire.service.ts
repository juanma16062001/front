import { EventEmitter, Injectable } from '@angular/core';
import { Client } from '../../services/api/client';
import { WireContractService } from '../blockchain/contracts/wire-contract.service';
import { TokenContractService } from '../blockchain/contracts/token-contract.service';
import { Web3WalletService } from '../blockchain/web3-wallet.service';
import { WireStruc } from './creator/creator.component';

@Injectable()
export class WireService {
  public wireSent: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private client: Client,
    private wireContract: WireContractService,
    private tokenContract: TokenContractService,
    private web3Wallet: Web3WalletService
  ) { }

  async submitWire(wire: WireStruc) {
    let payload = wire.payload;

    if (!wire.amount || wire.amount < 0) {
      throw new Error('Amount should be a positive number');
    }

    switch (wire.payloadType) {
      case 'onchain':
        await this.web3Wallet.ready();

        if (this.web3Wallet.isUnavailable()) {
          throw new Error('No Ethereum wallets available on your browser.');
        } else if (!(await this.web3Wallet.unlock())) {
          throw new Error('Your Ethereum wallet is locked or connected to another network.');
        }

        if (payload.receiver == await this.web3Wallet.getCurrentWallet(true)) {
          throw new Error('You cannot wire yourself.');
        }

        try {
          if (wire.recurring) {
            await this.tokenContract.increaseApproval(
              (await this.wireContract.wire()).address,
              wire.amount * 11,
              `We need you to pre-approve Minds Wire wallet for the recurring wire transactions.`
            );
          }

          payload.address = await this.web3Wallet.getCurrentWallet(true);
          payload.txHash = await this.wireContract.create(payload.receiver, wire.amount);
          payload.method = 'onchain';
        } catch (e) {
          console.error('[Wire/Token]', e);
          throw new Error('Either you cancelled the approval, or there was an error processing it.');
        }
        break;

      case 'creditcard':
        payload.method = 'creditcard';
        break;

      case 'offchain':
        payload = { method: 'offchain', address: 'offchain' };
        break;
    }

    try {
      let response: any = await this.client.post(`api/v1/wire/${wire.guid}`, {
        payload,
        method: 'tokens',
        amount: wire.amount,
        recurring: wire.recurring
      });

      this.wireSent.next(wire);
      return { done: true };
    } catch (e) {
      if (e && e.stage === 'transaction') {
        throw new Error('Sorry, your payment failed. Please, try again or use another card');
      }

      throw e;
    }
  }
}
