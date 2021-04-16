import {ISearchRequestConfig} from "../../interfaces/common";
import {IMonitorSearchResponse} from "../../interfaces/monitor";
import {Monitor} from "../../monitor";
import {Waas} from "../../waas";
import {IDefaultIteratorValue, ResourcePageIterable} from "./resource-page-iterable";

interface IIteratorValue extends IDefaultIteratorValue<Monitor> {
}

export class MonitorPageIterable extends ResourcePageIterable<IMonitorSearchResponse, IIteratorValue> {

    constructor(waas: Waas, initialRequest: ISearchRequestConfig, private readonly walletName?: string) {
        super(waas, initialRequest)
    }

    protected convertApiResponse(res: IMonitorSearchResponse): IIteratorValue {
        const walletNameRegex = /\/eth\/wallet\/(.*)\/monitor\/.*/;
        const list = res.list.map(item => {
            // This iterable class can be used for a cross-wallet search where the wallet name is not known in advance and cannot be passed in the constructor.
            // However, since monitors are wallet-bound, the wallet name is required for initialization.
            // Unlike the monitor id, however, the wallet name is not part of the API response, which contains only a few properties and HATEOAS links.
            // Therefore, we extract the wallet name from the link to correctly initialize a monitor object.
            // This is certainly not ideal, but currently seems to be the best solution for a clear SDK code design.
            let wallet = this.walletName;
            if (!wallet) {
                const match = walletNameRegex.exec(item.links[0].href);
                if (!match || match.length < 2) {
                    throw new Error(`Could not find out the wallet name of the monitor '${item.monitor}' returned by the API`);
                }
                wallet = match[1];
            }
            return new Monitor(this.waas, item.monitor, wallet);
        });
        return {
            hits: res.hits,
            list,
        };
    }

}
