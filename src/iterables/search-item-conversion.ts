import {EthTransactionEvent} from "../eth-transaction-event";
import {IHateoasLink} from "../interfaces/common";
import {IEventSearchResponse} from "../interfaces/ethereum-contract";
import {IMonitorSearchResponse} from "../interfaces/monitor";
import {Monitor} from "../monitor";
import {Waas} from "../waas";


// These functions convert API search result items into the corresponding SDK objects.
// It doesn't seem ideal to simply transfer the HATEOAS links into classes like Wallet or Monitor, because otherwise they would have to handle the link.
// However, these classes actually represent the associated API endpoints and are also used with .monitor("any-monitor-id"), for example.
// Here, the user is not supposed to pass a HATEOAS link, but e.g. only the id information (which is used internally to build the URL).
// To make these classes thus generally applicable, we extract necessary information from the HATEOAS links (such as monitor id or wallet name) and initialize the objects as usual.
// This is certainly not ideal, but currently seems to be the best solution for a clear SDK class design.

/**
 * Converts a single item that is a result of a monitor search into the associated SDK object that can be used to address that monitor endpoint.
 * @param item - API search response item
 * @param waas - Current WaaS instance
 * @param [wallet] - If set, this wallet name will be assigned to all initialized monitor objects. So this option should be used carefully.
 */
export function convertToMonitor(item: IMonitorSearchResponse["list"][0], waas: Waas, wallet?: string): Monitor {
    if (!wallet) {
        const walletNameRegex = /\/eth\/wallet\/(.*)\/monitor\/.*/;
        const link = findHateoasGetLink(item.links, "monitor");
        const matches = walletNameRegex.exec(link);
        if (!matches || matches.length < 2) {
            throw new Error(`Could not find out the wallet name of the monitor '${item.monitor}' returned by the API`);
        }
        wallet = matches[1];
    }
    return new Monitor(waas, item.monitor, wallet);
}

/**
 * Converts a single item that is a result of a Ethereum event search into the associated SDK object that can be used to address that event endpoint.
 * @param item - API search response item
 * @param waas - Current WaaS instance
 */
export function convertToEthEvent(item: IEventSearchResponse["list"][0], waas: Waas): EthTransactionEvent {
    const regex = /\/eth\/transaction\/(.*)\/event\/(.*)/;
    const link = findHateoasGetLink(item.links, "event");
    const matches = regex.exec(link);
    if (!matches || matches.length < 3) {
        throw new Error("Could not find out the relevant information for the transaction event returned by the API");
    }
    const hash = matches[1];
    const index = Number(matches[2]);
    return new EthTransactionEvent(waas, hash, index, item.event,);
}

/**
 * Tries to find the HATEOAS GET link to retrieve further details.
 * @param links - Array of HATEOAS links returned by the API
 * @param expectedRelation - Name of the resource to which the GET link should point
 */
export function findHateoasGetLink(links: IHateoasLink<string>[], expectedRelation: string): string {
    const link = links.find(l => l.type.toUpperCase() === "GET");
    if (!link || link.rel !== expectedRelation) {
        throw new Error("A URL for a GET request for further information was expected, but none was found");
    }
    return link.href;
}
