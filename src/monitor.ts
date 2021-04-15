import * as t from "typeforce";
import {IMonitor, IMonitorCreationProperties, IMonitorSearchParams} from "./interfaces/monitor";
import {MonitorPageIterable} from "./iterables/monitor-page-iterable";
import {AtLeastOne} from "./types/common";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";

/** Custom type for partial wallet updates that requires at least one property */
type MonitorUpdateValues = AtLeastOne<Omit<IMonitorCreationProperties, "target">>;

export class Monitor implements IWaasMethod {

    constructor(public waas: Waas, private readonly _monitorId?: string, private readonly _wallet?: string) {
        t("?String", _monitorId);
        t("?String", _wallet);
    }

    /**
     * Returns the monitor id or throws an error if this optional property is not set.
     */
    public get monitorId(): string {
        t("String", this._monitorId);
        return this._monitorId!;
    }

    /**
     * Returns the wallet name or throws an error if this optional property is not set.
     */
    public get wallet(): string {
        t("String", this._wallet);
        return this._wallet!;
    }

    /**
     * Returns the URL of the endpoint that represents a single monitor resource
     */
    private get baseUrlSingleResource(): string {
        return `eth/wallet/${this.wallet}/monitor/${this.monitorId}`;
    }

    /**
     * Returns the URL of the endpoint that represents the list of all monitors of the given wallet
     */
    private get baseUrlResourceList(): string {
        return `eth/wallet/${this.wallet}/monitors`;
    }

    /**
     * Returns an asynchronous iterable to iterate the monitors related to the current wallet.
     * @param [params] - Optional search parameters
     * @see [docs]{@link https://docs.tangany.com/#25362117-57b0-4c46-9e40-0e8e119a17b5}
     */
    public list(params?: Omit<IMonitorSearchParams, "wallet">): MonitorPageIterable {
        return new MonitorPageIterable(this.waas, {url: this.baseUrlResourceList, params}, this.wallet);
    }

    /**
     * Creates a new monitor based on the passed data.
     * @param [monitor] - Values to configure the monitor to create
     * @see [docs]{@link https://docs.tangany.com/#122ab4fc-d567-4fe9-aef0-7b3c332cd595}
     */
    public async create(monitor: IMonitorCreationProperties): Promise<IMonitor> {
        return this.waas.wrap<IMonitor>(() => this.waas.instance.post(this.baseUrlResourceList, monitor));
    }

    /**
     * Requests details for the given monitor id.
     * @see [docs]{@link https://docs.tangany.com/#6eba3872-6c54-4168-adf8-eda38e072e25}
     */
    public async get(): Promise<IMonitor> {
        return this.waas.wrap<IMonitor>(() => this.waas.instance.get(this.baseUrlSingleResource));
    }

    /**
     * Updates the given monitor partially.
     * @param newValues - Subset of properties that are allowed to be updated. Non-primitive properties like arrays or objects replace the previous value and therefore need to contain all desired values.
     * @see [docs]{@link https://docs.tangany.com/#13aa3fb9-a43d-42eb-83ce-fe7c1e17d021}
     */
    public async update(newValues: MonitorUpdateValues): Promise<IMonitor> {
        return this.waas.wrap<IMonitor>(() => this.waas.instance.patch(this.baseUrlSingleResource, newValues));
    }

    /**
     * Replaces the entire monitor.
     * @param newMonitorObj - Entire monitor configuration that will replace the previous resource
     * @see [docs]{@link https://docs.tangany.com/#b31f3bd1-26d2-48ef-b0da-aebcdc39b521}
     */
    public async replace(newMonitorObj: IMonitorCreationProperties): Promise<IMonitor> {
        return this.waas.wrap<IMonitor>(() => this.waas.instance.put(this.baseUrlSingleResource, newMonitorObj));
    }

    /**
     * Deletes the current monitor.
     * @see [docs]{@link https://docs.tangany.com/#c53538bb-e6fd-4948-bcb7-cc917eab7da0}
     */
    public async delete(): Promise<IMonitor> {
        return this.waas.wrap<IMonitor>(() => this.waas.instance.delete(this.baseUrlSingleResource));
    }

}
