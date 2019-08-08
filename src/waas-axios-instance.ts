import {AxiosInstance} from "axios";

export abstract class WaasAxiosInstance {
    protected readonly instance: AxiosInstance;

    constructor(instance: AxiosInstance) {
        this.instance = instance;
    }
}
