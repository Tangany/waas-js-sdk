import {AxiosRequestConfig} from "axios";
import {IPaginationResponse, ISearchRequestConfig} from "../../interfaces/common";
import {Waas} from "../../waas";

export interface IDefaultIteratorValue<T> {
    hits: {
        total: number;
    }
    list: T[];
}

/**
 * Custom asynchronous iterable that reads WaaS resources based on the passed URL and search parameters.
 * The iterator returns the entire page of the API pagination mechanism and is able to iterate through next and previous pages.
 */
export abstract class ResourcePageIterable<TApiResponse extends IPaginationResponse, TIteratorValue> implements AsyncIterableIterator<TIteratorValue> {

    // Store state for next iteration
    private nextPageUrl: string | null;
    private previousPageUrl: string | null;
    private isInitialRequestExecuted: boolean;

    constructor(
        protected readonly waas: Waas,
        private readonly initialRequest: ISearchRequestConfig,
    ) {
        this.nextPageUrl = initialRequest.url;
        this.previousPageUrl = null;
        this.isInitialRequestExecuted = false;
    }

    // It is important that the method returns the type of this class instead of AsyncIterableIterator (the base class).
    // AsyncIterableIterator defines only next(), but not the custom previous() method of this class.
    public [Symbol.asyncIterator](): ResourcePageIterable<TApiResponse, TIteratorValue> {
        return this;
    }

    public async next(): Promise<IteratorResult<TIteratorValue>> {
        return this.iteratePage(this.nextPageUrl);
    }

    public async previous(): Promise<IteratorResult<TIteratorValue>> {
        return this.iteratePage(this.previousPageUrl);
    }

    protected abstract convertApiResponse(res: TApiResponse): TIteratorValue;

    private async iteratePage(url: string | null): Promise<IteratorResult<TIteratorValue>> {
        // In contrast to a normal iterable (without the previous() method), it is not quite clear when the iterator has finished (when `done` is set to true).
        // Even if the last page is reached and next() returns null, the iterator could still be used to work with previous(), which in turn returns page content.
        // However, this is difficult to handle and the iterator would never finish, so "for await ... of" loops probably won't work as expected.
        if (!url) {
            return {
                value: null,
                done: true,
            }
        }

        const requestConfig: AxiosRequestConfig = {};
        // Ignore the query parameters after the initial request has been executed, because the returned pagination links contain all used filters
        if (!this.isInitialRequestExecuted) {
            requestConfig.params = this.initialRequest.params;
            this.isInitialRequestExecuted = true;
        }

        // Read accesses to resources are (currently) performed only via GET.
        // Therefore, for simplicity, there is currently no possibility to use another HTTP verb to retrieve the data of the next page.
        const res = await this.waas.wrap<TApiResponse>(() => this.waas.instance.get(url, requestConfig));

        this.nextPageUrl = res.links.next;
        this.previousPageUrl = res.links.previous;

        // Return value of current iteration
        const value = this.convertApiResponse(res);
        return {
            value,
            done: false,
        }
    }

}
