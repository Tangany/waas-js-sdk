import {IMonitorSearchResponse} from "../../interfaces/monitor";
import {Monitor} from "../../monitor";
import {convertToMonitor} from "../search-item-conversion";
import {ResourceIterable} from "./resource-iterable";

export class MonitorIterable extends ResourceIterable<IMonitorSearchResponse, Monitor> {

    protected convertResponseItem(item: IMonitorSearchResponse["list"][0]): Monitor {
        return convertToMonitor(item, this.waas);
    }

}
