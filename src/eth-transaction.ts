import * as t from "typeforce";
import {IEthereumTransaction} from "./interfaces/ethereum";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";

// TODO: This class represents the Ethereum transaction endpoint of the API and is therefore basically the same as classes for wallets or monitors.
//  Therefore, according to the hierarchical structure, it should actually be used to implement something like .eth().transaction("any-hash").get().
//  However, this is a breaking change because currently the transaction hash is passed directly to the Ethereum class and
//  there is a separate method for transaction details (which does not follow the otherwise standard to use .get()).
//  There are also other methods in the Ethereum class for events, for example, which would then also need to be moved and named in a compliant manner.

export class EthTransaction implements IWaasMethod {

    public get hash(): string {
        return this._hash;
    }

    constructor(public waas: Waas, private readonly _hash: string) {
        t("String", _hash);
    }

    /**
     * Requests details for the given transaction hash.
     * @see [docs]{@link https://docs.tangany.com/#7b314b47-012c-4baa-b928-dd32c7db1e41}
     */
    public async get(): Promise<IEthereumTransaction> {
        return this.waas.wrap<IEthereumTransaction>(() => this.waas.instance.get(`eth/transaction/${this.hash}`));
    }

}
