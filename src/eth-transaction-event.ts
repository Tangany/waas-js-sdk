import * as t from "typeforce";
import {ITransactionEvent} from "./interfaces/ethereum-contract";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";

// TODO: This class represents the API endpoint for Ethereum events and should therefore be used in a compliant manner with the other endpoint-representing classes.
//  For example like this: .eth().transaction("any-hash").event(1).get() or .eth().transaction("any-hash").event().list().
//  However, currently there are separate methods for this at the Ethereum class level instead and it would be a breaking change.
//  See also the comment in the Ethereum transaction class.

export class EthTransactionEvent implements IWaasMethod {

    /**
     * Returns the transaction hash or throws an error if this optional property is not set.
     */
    public get hash(): string {
        t("String", this._hash);
        return this._hash!;
    }

    /**
     * Returns the Ethereum event log index or throws an error if this optional property is not set.
     */
    public get index(): number {
        t("Number", this._index);
        return this._index!;
    }

    /**
     * Returns the event name or throws an error if this optional property is not set.
     */
    public get name(): string {
        t("String", this._name);
        return this._name!;
    }

    constructor(public waas: Waas,
                private readonly _hash: string,
                private readonly _index: number,
                private readonly _name: string) {
        t("?String", _hash);
        t("?Number", _index);
        t("?String", _name);
    }

    /**
     * Requests details for the given event index.
     * @see [docs]{@link https://docs.tangany.com/#43f498df-e261-4d17-8ab0-499f060313b5}
     */
    public async get(): Promise<ITransactionEvent> {
        return this.waas.wrap<ITransactionEvent>(() => this.waas.instance.get(`eth/transaction/${this.hash}/event/${this.index}`));
    }

}
