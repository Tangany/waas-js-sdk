import {EthTransactionEvent} from "../eth-transaction-event";
import {IEventSearchResponse} from "../interfaces/ethereum-contract";
import {IDefaultIteratorValue, ResourcePageIterable} from "./resource-page-iterable";

interface IIteratorValue extends IDefaultIteratorValue<EthTransactionEvent> {
}

export class EthEventPageIterable extends ResourcePageIterable<IEventSearchResponse, IIteratorValue> {

    protected convertApiResponse(res: IEventSearchResponse): IIteratorValue {
        const regex = /\/eth\/transaction\/(.*)\/event\/(.*)/;
        const list = res.list.map(item => {
            const link = item.links.find(l => l.type.toUpperCase() === "GET");
            if (!link) {
                throw new Error("A URL for a GET request for further information was expected, but none was found");
            }
            const matches = regex.exec(link.href);
            if (!matches || matches.length < 3) {
                throw new Error("Could not find out the relevant information for the transaction event returned by the API");
            }
            return new EthTransactionEvent(this.waas, item.event, Number(matches[1]), matches[2]);
        });
        return {
            hits: res.hits,
            list,
        }
    }

}
