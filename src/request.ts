import * as t from "typeforce";
import {IAsyncRequestStatus} from "./interfaces/common";
import {poll} from "./utils/polling-helper";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";

/**
 * Instantiates a new interface to interact with asynchronous requests
 * CAUTION: This class is the default implementation and just passes through the result received from the API when {@link get} is called.
 * Thus, if a type is supplied for `TOutput` that does not match the format of the API response in `output`, the return type suggests that a conversion occurred.
 * However, this is not the case. Therefore, use a child class with appropriate overrides (like {@link EthTransactionRequest}) if a conversion of the output is necessary.
 * @param waas - {@link Waas} instance
 * @param id - Asynchronous request id
 * @template TOutput - Type of the request output (for child classes the type **after** conversion)
 */
export class Request<TOutput extends Record<string, any>> implements IWaasMethod {

    constructor(public waas: Waas, public readonly id: string) {
        // Make sure that the variable is set and has the correct type
        t("String", id);
    }

    /**
     * Retrieves the current status for a long-running asynchronous request
     * @see [docs]{@link https://docs.tangany.com/#a6351116-3e2c-4f02-add8-d424c6212f60}
     */
    public async get(): Promise<IAsyncRequestStatus<TOutput>> {
        // Since this class is the base implementation, just forward the fetched API result and apply the passed generic to it
        return this.fetchStatus<TOutput>();
    }

    protected async fetchStatus<S>(): Promise<IAsyncRequestStatus<S>> {
        return this.waas.wrap<IAsyncRequestStatus<S>>(() => this.waas.instance.get(`request/${this.id}`));
    }

    /**
     * Waits until the asynchronous request is completed and then resolves or rejects on error or timeout.
     * This method does _not_ evaluate the output of the process (for example, the transaction status)
     * because asynchronous requests are used for arbitrary calls and their output therefore varies.
     * Attention: The method polls the API frequently and may result in excessive quota usage.
     * @param [timeout] - Number of seconds after which the method stops waiting and rejects
     * @param [pollingInterval] - Delay between API calls for polling (in milliseconds)
     */
    public async wait(timeout = 20e3, pollingInterval = 4e2): Promise<IAsyncRequestStatus<TOutput>> {
        // This code block indicates whether the expected API response has been received so that polling can be terminated.
        // Along with other class-specific parameters, this allows us to use a general polling function.
        const isCompleted = (res: IAsyncRequestStatus<TOutput>) => res.process === "Completed";
        return poll(this.get.bind(this), isCompleted, `request ${this.id}`, timeout, pollingInterval);
    }

}
