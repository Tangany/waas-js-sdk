import {IWalletSearchResponse} from "../../interfaces/wallet";
import {Wallet} from "../../wallet";
import {ResourceIterable} from "./resource-iterable";

export class WalletIterable extends ResourceIterable<IWalletSearchResponse, Wallet> {

    protected convertResponseItem(item: IWalletSearchResponse["list"][0]): Wallet {
        return new Wallet(this.waas, item.wallet);
    }
}
