import {AxiosError, AxiosInstance, AxiosResponse} from "axios";
import {NotFoundError} from "./errors/not-found-error";

export class WaasAxiosInstance {
    protected readonly instance: AxiosInstance;

    constructor(instance: AxiosInstance) {
        this.instance = instance;
    }

    public async catch404(e: AxiosError): Promise<AxiosResponse> {
        if (e.response && e.response.status === 404) {
            throw new NotFoundError("Wallet not found for given name");
        }
        throw e;
    }
}
