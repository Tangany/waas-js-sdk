import {ISearchRequestConfig} from "../../interfaces/common";
import {IMonitorSearchResponse} from "../../interfaces/monitor";
import {Monitor} from "../../monitor";
import {Waas} from "../../waas";
import {convertToMonitor} from "../search-item-conversion";
import {IDefaultIteratorValue, ResourcePageIterable} from "./resource-page-iterable";

interface IIteratorValue extends IDefaultIteratorValue<Monitor> {
}

export class MonitorPageIterable extends ResourcePageIterable<IMonitorSearchResponse, IIteratorValue> {

    constructor(waas: Waas, initialRequest: ISearchRequestConfig, private readonly walletName?: string) {
        super(waas, initialRequest)
    }

    protected convertApiResponse(res: IMonitorSearchResponse): IIteratorValue {
        const list = res.list.map(item => convertToMonitor(item, this.waas, this.walletName));
        return {
            hits: res.hits,
            list,
        };
    }

}
