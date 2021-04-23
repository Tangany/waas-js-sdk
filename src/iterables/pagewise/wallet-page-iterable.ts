import {IWalletSearchResponse} from "../../interfaces/wallet";
import {Wallet} from "../../wallet";
import {ResourcePageIterable} from "./resource-page-iterable";

interface IIteratorValue {
    hits: IWalletSearchResponse["hits"];
    list: Wallet[];
}

export class WalletPageIterable extends ResourcePageIterable<IWalletSearchResponse, IIteratorValue> {

    protected convertApiResponse(res: IWalletSearchResponse): IIteratorValue {
        const list = res.list.map(x => new Wallet(this.waas, x.wallet));
        return {
            hits: res.hits,
            list,
        };
    }

}
