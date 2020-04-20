import * as t from "typeforce";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";
import {Wallet} from "./wallet";

/**
 * Base for classes that provide an interface for wallet actions, e.g. on the Bitcoin or Ethereum blockchain.
 */
export abstract class BlockchainWallet implements IWaasMethod {

    constructor(public waas: Waas, public readonly walletInstance: Wallet) {
    }

    public get wallet() {
        t("String", this.walletInstance.wallet);
        return this.walletInstance.wallet;
    }

}
