import * as t from "typeforce";
import {EthTransaction} from "./eth-transaction";
import {Waas} from "./waas";

/**
 * Properties returned for an asynchronously executed transaction along with the link to the full details of the transaction. So this information is available without any further fetch.
 */
interface IDetails {
    hash: string;
    blockNr: number;
    data: string;
    status: string;
    nonce: number;
}

/**
 * Represents the result that asynchronous sending Ethereum endpoints return.
 */
export class EthTransactionAsync extends EthTransaction {

    public get blockNr(): number {
        return this.details.blockNr;
    }

    public get data(): string {
        return this.details.data;
    }

    public get status(): string {
        return this.details.status;
    }

    public get nonce(): number {
        return this.details.nonce;
    }

    constructor(waas: Waas, private readonly details: IDetails) {
        super(waas, details.hash);
        t({
            hash: "String",
            blockNr: "Number",
            data: "String",
            status: "String",
            nonce: "Number",
        }, details);
    }
}
