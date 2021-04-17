import {AxiosRequestConfig} from "axios";
import {ISearchRequestConfig, ISearchResponse} from "../../interfaces/common";
import {Waas} from "../../waas";

/**
 * Base class to provide the results of API search requests as an asynchronous iterable that returns a single object per iteration rather than the complete results page.
 * Nevertheless, each search result page is not fetched for each iteration, but only once.
 * As soon as all items of the result list of the currently stored page have been returned, the next result page is fetched automatically.
 * This way, the iterable hides the API-side pagination from the user such that it looks like an ordinary list of single objects that are actually located across pages.
 * @template TApiResponse - Type of an entire search result page returned by the API
 * @template TIteratorValue - Type of the item returned per iteration, usually created by converting single API search result items
 */
export abstract class ResourceIterable<TApiResponse extends ISearchResponse, TIteratorValue> implements AsyncIterable<TIteratorValue> {

    /**
     * Returns statistics on how many resources met the search criteria.
     * This getter returns a Promise because the initial API search request is performed if that has not yet been done and the first page is therefore not in memory.
     * If the first search result page is already stored, e.g. because the iterator has been used, the value is read from memory without any further HTTP request.
     */
    public get hits(): Promise<TApiResponse["hits"]> {
        return this.getFirstPage().then(x => x.hits);
    }

    /**
     * Explicitly store the first search result page because it contains common information (just like all other pages).
     * It also serves as a kind of flag that the initial request has already been executed and the pagination links are followed from now on.
     */
    private firstPage?: TApiResponse;

    public constructor(protected readonly waas: Waas, private readonly initialRequest: ISearchRequestConfig) {
    }

    /**
     * Returns the asynchronous iterator to traverse the list of items.
     */
    public async* [Symbol.asyncIterator]() {
        let currentPage = await this.getFirstPage();
        let allItemsYielded = false;
        while (!allItemsYielded) {
            for (const item of currentPage.list) {
                yield this.convertResponseItem(item);
            }
            // Query the next page of search results once all items of the current page have been yielded (if there is a next one)
            const nextPageUrl = currentPage.links.next;
            if (nextPageUrl) {
                // Do not use the query params as the first call is already done and the pagination links contain all the query params
                currentPage = await this.fetchPage(nextPageUrl)
            } else {
                allItemsYielded = true;
            }
        }
    }

    /**
     * Converts an item returned by the API to conform to `TIteratorValue`.
     * This method must be implemented by the respective child classes because each API resource may require a different transformation.
     * @param item - Single search result item returned by the API
     */
    protected abstract convertResponseItem(item: TApiResponse["list"][0]): TIteratorValue;

    /**
     * Reads the first search result page from memory if it has previously been fetched, or performs the initial HTTP request otherwise.
     * Note that in the latter case the result is stored in the corresponding private property.
     */
    protected async getFirstPage(): Promise<TApiResponse> {
        if (!this.firstPage) {
            const {url, params} = this.initialRequest;
            this.firstPage = await this.fetchPage(url, params);
        }
        return this.firstPage;
    }

    /**
     * Queries another search results page based on the passed arguments.
     * @param url - URL to be used for the HTTP GET request
     * @param [params] - Query parameters to set the search criteria (usually only necessary to fetch the first page)
     */
    private async fetchPage(url: string, params?: object): Promise<TApiResponse> {
        const config: AxiosRequestConfig = {};
        if (params) {
            config.params = params;
        }
        return this.waas.wrap<TApiResponse>(() => this.waas.instance.get(url, config));
    }

}
