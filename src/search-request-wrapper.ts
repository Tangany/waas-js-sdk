import {ISearchResponse} from "./interfaces";
import {Waas} from "./waas";

/**
 * Represents a blockchain search request where the original URL references to resources are replaced by TypeScript methods.
 * The generic type TDetail describes the structure of a request for an individual resource (for example, a transaction).
 * The generic type TData defines which object properties an element in the result list contains apart from method accesses such as get(),
 * for example, "hash" for transactions.
 */
export interface ISearchResult<TDetail, TData> {
    hits: ISearchResponse["hits"];
    list: (ResourceMethods<TDetail> & TData)[];
    previous: () => Promise<ISearchResult<TDetail, TData>> | null;
    next: () => Promise<ISearchResult<TDetail, TData>> | null;
}

/**
 * This interface represents the methods that each search result item contains to navigate further in the resources.
 * This is the counterpart to the URLs that WaaS actually sends in the response.
 */
interface ResourceMethods<T> {
    get: () => Promise<T>
}

/**
 * Executes a WaaS-Call based on the passed URL and parameters, which reads information from the
 * blockchain (such as transactions or events). These endpoints return URLs for further navigation, which this method
 * converts into convenient method calls. In order to support recursion, either only a URL with preset query parameters or
 * a base URL and an object with parameters can be passed.
 * @param waas - Current WaaS instance
 * @param url - URL to access the search endpoint (can already contain all query parameters)
 * @param [params] - Optional query parameters that are added to the HTTP call
 * @template TDetail - Data type that describes the query result of a single resource (for example, a specific transaction)
 * @template TData - Describes which properties each search result item contains in addition to methods like get() (for example, "hash" for transactions)
 */
export async function wrapSearchRequest<TDetail, TData>(
    waas: Waas,
    url: string,
    params: object = {}
): Promise<ISearchResult<TDetail, TData>> {

    const response = await waas.wrap<ISearchResponse>(() => waas.instance.get(url, {params}));
    const {hits, links: {previous, next}} = response;

    // Use the pagination URL to call the function recursively (without parameters, since these are already set in the URL)
    const paginate = (paginationUrl: string | null) => paginationUrl ?
        wrapSearchRequest<TDetail, TData>(waas, paginationUrl)
        : null;

    // Unfortunately, the return type of the mapped object must be any (as far as I know) in this case,
    // otherwise there will be problems with the type generics.
    const list = response.list.map<any>(item => {
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

    return {
        hits,
        list,
        previous: () => paginate(previous),
        next: () => paginate(next),
    };
}
