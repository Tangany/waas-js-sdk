import {EthTransaction} from "../eth-transaction"
import {ITransactionSearchResponse} from "../interfaces/ethereum";
import {IDefaultIteratorValue, ResourcePageIterable} from "./resource-page-iterable";

interface IIteratorValue extends IDefaultIteratorValue<EthTransaction> {
}

export class EthTransactionPageIterable extends ResourcePageIterable<ITransactionSearchResponse, IIteratorValue> {

    protected convertApiResponse(res: ITransactionSearchResponse): IIteratorValue {
        const list = res.list.map(item => new EthTransaction(this.waas, item.hash));
        return {
            hits: res.hits,
            list,
        }
    }

}
