import {ISearchOptions, ISearchRequestConfig} from "./interfaces/common";
import {IMonitorSearchParams} from "./interfaces/monitor";
import {MonitorIterable} from "./iterables/auto-pagination/monitor-iterable";
import {MonitorPageIterable} from "./iterables/pagewise/monitor-page-iterable";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";

/**
 * Represents the endpoint to interact with all Ethereum monitors in a cross-wallet manner.
 */
export class EthMonitorSearch implements IWaasMethod {

    constructor(public waas: Waas) {
    }

    /**
     * Returns an asynchronous iterable to iterate **page by page** through the monitors that matched the search parameters.
     * @param [params] - Optional search parameters
     * @see [docs]{@link https://docs.tangany.com/#0cf31f8c-9ae1-4709-9ca6-842452d74b10}
     */
    public list(params?: IMonitorSearchParams): MonitorPageIterable;

    /**
     * Returns an asynchronous iterable that yields **one monitor object per iteration**.
     * A page of monitors that match the search parameters is fetched and saved once, so that all items can be returned one by one.
     * After that, the next page is loaded from the API and processed item by item again.
     * @param [params] - Optional search parameters
     * @param [options] - Additional options that do not affect the API request but the SDK-side processing
     * @see [docs]{@link https://docs.tangany.com/#0cf31f8c-9ae1-4709-9ca6-842452d74b10}
     */
    public list(params?: IMonitorSearchParams, options?: { autoPagination: true }): MonitorIterable;

    /**
     * Returns an asynchronous iterable to iterate **page by page** through the monitors that matched the search parameters.
     * @param [params] - Optional search parameters
     * @param [options] - Additional options that do not affect the API request but the SDK-side processing
     * @see [docs]{@link https://docs.tangany.com/#0cf31f8c-9ae1-4709-9ca6-842452d74b10}
     */
    // tslint:disable-next-line:unified-signatures
    public list(params?: IMonitorSearchParams, options?: ISearchOptions): MonitorPageIterable;

    public list(params?: IMonitorSearchParams, options?: ISearchOptions): MonitorIterable | MonitorPageIterable {
        const initialRequest: ISearchRequestConfig = {url: "eth/monitors", params};
        if (options?.autoPagination) {
            return new MonitorIterable(this.waas, initialRequest);
        } else {
            return new MonitorPageIterable(this.waas, initialRequest);
        }
    }

}
