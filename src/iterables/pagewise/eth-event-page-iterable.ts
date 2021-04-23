import {EthTransactionEvent} from "../../eth-transaction-event";
import {IEventSearchResponse} from "../../interfaces/ethereum-contract";
import {convertToEthEvent} from "../search-item-conversion";
import {IDefaultIteratorValue, ResourcePageIterable} from "./resource-page-iterable";

interface IIteratorValue extends IDefaultIteratorValue<EthTransactionEvent> {
}

export class EthEventPageIterable extends ResourcePageIterable<IEventSearchResponse, IIteratorValue> {

    protected convertApiResponse(res: IEventSearchResponse): IIteratorValue {
        const list = res.list.map(item => convertToEthEvent(item, this.waas));
        return {
            hits: res.hits,
            list,
        }
    }

}
