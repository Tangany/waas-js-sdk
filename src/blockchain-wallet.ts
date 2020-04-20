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

    /**
     * Determines the request id from an server response to an asynchronous request.
     * The server always returns the location of the server resource that represents the status of the
     * asynchronous request. From this, only the ID is extracted.
     * @param serverResponse - Object that represents the raw server response of an asynchronous endpoint
     */
    protected extractRequestId(serverResponse: { [key: string]: any }): string {
        const {statusUri} = serverResponse;
        const matches = statusUri?.match(/(?!.*\/).+/);
        if (!matches || matches.length > 1) {
            throw new Error("The API call for asynchronously sending a transaction has returned an unexpected format");
        }
        return matches[0];
    }

}
