import * as t from "typeforce";
import {IAsyncRequestStatus} from "./interfaces";
import {poll} from "./polling-helper";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";

/**
 * Instantiates a new interface to interact with asynchronous requests
 * @param waas - {@link Waas} instance
 * @param id - Asynchronous request id
 */
export class Request<T extends Record<string, any>> implements IWaasMethod {

    constructor(public waas: Waas, public readonly id: string) {
        // Make sure that the variable is set and has the correct type
        t("String", id);
    }

    /**
     * Retrieves the current status for a long-running asynchronous request
     * @see [docs]{@link https://docs.tangany.com/#a6351116-3e2c-4f02-add8-d424c6212f60}
     */
    public async get(): Promise<IAsyncRequestStatus<T>> {
        return this.waas.wrap<IAsyncRequestStatus<T>>(() => this.waas.instance.get(`request/${this.id}`));
    }

    /**
     * Waits until the asynchronous request is completed and then resolves or rejects on error or timeout.
     * This method does _not_ evaluate the output of the process (for example, the transaction status)
     * because asynchronous requests are used for arbitrary calls and their output therefore varies.
     * Attention: The method polls the API frequently and may result in excessive quota usage.
     * @param [timeout] - Number of seconds after which the method stops waiting and rejects
     * @param [pollingInterval] - Delay between API calls for polling (in milliseconds)
     */
    public async wait(timeout = 20e3, pollingInterval = 4e2): Promise<IAsyncRequestStatus<T>> {
        // This code block indicates whether the expected API response has been received so that polling can be terminated.
        // Along with other class-specific parameters, this allows us to use a general polling function.
        const isCompleted = (res: IAsyncRequestStatus<T>) => res.process === "Completed";
        return poll(this.get.bind(this), isCompleted, `request ${this.id}`, timeout, pollingInterval);
    }

}
