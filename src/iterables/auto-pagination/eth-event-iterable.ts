import {EthTransactionEvent} from "../../eth-transaction-event";
import {IEventSearchResponse} from "../../interfaces/ethereum-contract";
import {convertToEthEvent} from "../search-item-conversion";
import {ResourceIterable} from "./resource-iterable";

export class EthEventIterable extends ResourceIterable<IEventSearchResponse, EthTransactionEvent> {

    protected convertResponseItem(item: IEventSearchResponse["list"][0]): EthTransactionEvent {
        return convertToEthEvent(item, this.waas);
    }

}
