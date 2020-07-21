import * as t from "typeforce";
import {IAsyncRequestStatus} from "./interfaces";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";

/**
 * Instantiates a new interface to interact with asynchronous requests
 * @param waas - {@link Waas} instance
 * @param id - Asynchronous request id
 */
export class Request implements IWaasMethod {

    constructor(public waas: Waas, public readonly id: string) {
        // Make sure that the variable is set and has the correct type
        t("String", id);
    }

    /**
     * Retrieves the current status for a long-running asynchronous request
     * @see [docs]{@link https://docs.tangany.com/#a6351116-3e2c-4f02-add8-d424c6212f60}
     */
    public async get(): Promise<IAsyncRequestStatus> {
        return this.waas.wrap<IAsyncRequestStatus>(() => this.waas.instance.get(`request/${this.id}`));
    }
}
