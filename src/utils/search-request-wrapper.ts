import {ISearchResponse} from "../interfaces/common";
import {ITransactionSearchParams} from "../interfaces/ethereum";
import {IEventArgumentFilter, IEventSearchParams} from "../interfaces/ethereum-contract";
import {Waas} from "../waas";

/**
 * Represents a AsyncIterable object for a blockchain search request where the original URL references to resources are replaced by TypeScript methods.
 * The generic type TDetail describes the structure of a request for an individual resource (for example, a transaction).
 * The generic type TData defines which object properties an element in the result list contains apart from method accesses such as get(),
 * for example, "hash" for transactions.
 * @param TDetail - Data type that describes the query result of a single resource (for example, a specific transaction)
 * @param TData - Describes which properties each search result item contains in addition to methods like get() (for example, "hash" for transactions)
 */
export interface ISearchResultIterable<TDetail, TData> extends AsyncIterable<ISearchResultValue<TDetail, TData>> {
    [Symbol.asyncIterator]: () => ISearchResultIterator<TDetail, TData>
}

/**
 * Async Iterator that is able to iterate next and previous results
 */
export interface ISearchResultIterator<TDetail, TData> extends AsyncIterator<ISearchResultValue<TDetail, TData>> {
    next: () => Promise<IteratorResult<ISearchResultValue<TDetail, TData>, ISearchResultValue<TDetail, TData>>>;
    previous: () => Promise<IteratorResult<ISearchResultValue<TDetail, TData>, ISearchResultValue<TDetail, TData>>>;
}

export interface ISearchResultValue<TDetail, TData> {
    hits: ISearchResponse["hits"];
    list: (ResourceMethods<TDetail> & TData)[];
}

/**
 * This interface represents the methods that each search result item contains to navigate further in the resources.
 * This is the counterpart to the URLs that WaaS actually sends in the response.
 */
interface ResourceMethods<T> {
    get: () => Promise<T>
}

/**
 * Returns an AsyncIterable which executes a WaaS-Call based on the passed URL and parameters, which reads information from the
 * blockchain (such as transactions or events). These endpoints return URLs for further navigation, which this method
 * converts into convenient method calls. In order to support recursion, either only a URL with preset query parameters or
 * a base URL and an object with parameters can be passed.
 * @param waas - Current WaaS instance
 * @param url - URL to access the search endpoint. Mustn't contain any URL query parameters
 * @param [params] - Optional query parameters that are added to the HTTP call
 * @template TDetail - Data type that describes the query result of a single resource (for example, a specific transaction)
 * @template TData - Describes which properties each search result item contains in addition to methods like get() (for example, "hash" for transactions)
 */
export function wrapSearchRequestIterable<TDetail, TData>(
    waas: Waas,
    url: string,
    params: ITransactionSearchParams | IEventSearchParams = {}
): ISearchResultIterable<TDetail, TData> {

    let previous: string | null;
    let next: string | null = url;
    let queryParams = params;

    if (/[?&=]/.test(url)) {
        throw new Error("The search endpoint URL mustn't contain any URL query parameters")
    }

    /**
     * enrich search request list with fetch methods
     */
    const getResponseList = (response: ISearchResponse) => response.list.map<any>(item => {
        const {links, ...rest} = item;
        // This line is of course very much adapted to the current interface (only the GET method) in order
        // not to make the logic here even more complicated. For WaaS changes this must be extended.
        const detailUri = links.find(l => l.type === "GET")?.href;
        if (!detailUri) {
            throw new Error("A URL for a GET request for further information was expected, but none was found");
        }
        return {
            ...rest,
            get: () => waas.wrap<TDetail>(() => waas.instance.get(detailUri)),
        }
    });

    /**
     * fetch data for given url and return it in a iterator like response
     */
    const iteratePage = async (_url: string | null, cb: (_response: ISearchResponse) => void): Promise<IteratorResult<ISearchResultValue<TDetail, TData>>> => {
        if (!_url) {
            return {
                value: null,
                done: true
            }
        }

        // Build a custom query string for event argument filters due to its custom format
        if ("argumentFilters" in queryParams && queryParams.argumentFilters !== undefined) {
            _url += composeEventArgumentQuery(queryParams.argumentFilters);
            delete queryParams.argumentFilters; // Remove this property as it is SDK-specific and cannot be processed by the endpoint
        }

        // If the URL already contains parts of a URL query like ".../resource?foo=true"
        // and additional query parameters are defined in the options like {params: {bar: 42, active: "yes"}},
        // axios will merge them correctly, thus recognizing that the query already starts with ?: .../resource?foo=true&bar=42&active="yes"
        const response: ISearchResponse = await waas.wrap<ISearchResponse>(
            () => waas.instance.get(_url!, {params: queryParams}));

        const list = getResponseList(response);
        const hits = response.hits;

        // preserve state for next iterations
        cb(response)

        // reset request params for the next iteration since the next link already contains all required query params
        queryParams = {};

        return {
            value: {
                hits,
                list,
            },
            done: false,
        }
    }

    // iterator object
    const asyncIterator: ISearchResultIterator<TDetail, TData> = {
        next: async () => iteratePage(next, response => {
            previous = response.links?.previous;
            next = response.links?.next;
        })
        , previous: async () => iteratePage(previous, response => {
            previous = response.links?.previous;
            next = response.links?.next;
        })
    }


    return {
        [Symbol.asyncIterator]: () => asyncIterator // AsyncIterable
    };
}

/**
 * Assembles a URL query string to filter events based on their arguments.
 * This way, a JavaScript-side configuration with objects is built into a URL string compatible with WaaS.
 * @param argFilters - Configured event argument filters
 */
export function composeEventArgumentQuery(argFilters: IEventArgumentFilter[]): string {
    return argFilters.reduce<string>((accumulatedQuery, filter) => {
        const {position, type, value} = filter;

        if (!(position || type || value)) {
            throw new Error("An argument filter object must define at least one criterion");
        }

        // If it is the first URL query parameter, use "?", otherwise use "&" to join multiple filters
        let s = `${accumulatedQuery === "" ? "?" : "&"}inputs`;

        // Ensure that the brackets are created to produce the form "inputs[]" even if no position is specified
        s += `[${position !== undefined ? JSON.stringify(position) : ""}]`;

        if (type) {
            s += `.${type}`;
        }
        if (value) {
            s += `=${JSON.stringify(value)}`;
        }

        return accumulatedQuery + s;
    }, "");
}
