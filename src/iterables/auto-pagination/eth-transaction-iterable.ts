import {EthTransaction} from "../../eth-transaction";
import {ITransactionSearchResponse} from "../../interfaces/ethereum";
import {ResourceIterable} from "./resource-iterable";

export class EthTransactionIterable extends ResourceIterable<ITransactionSearchResponse, EthTransaction> {

    protected convertResponseItem(item: ITransactionSearchResponse["list"][0]): EthTransaction {
        return new EthTransaction(this.waas, item.hash);
    }

}
