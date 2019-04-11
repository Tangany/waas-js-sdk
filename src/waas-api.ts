import axios, {AxiosError, AxiosResponse} from "axios";
import * as Debug from "debug";
import {Wallet} from "./wallet";
import {WaasAxiosInstance} from "./waas-axios-instance";
import {Ethereum} from "./eth";
import {AuthenticationError} from "./errors/authentication-error";

const debug = Debug("waas-js-sdk:main");

export enum WalletVersion {
    LATEST = "latest",
}

export enum WalletSecurity {
    SOFTWARE = "software",
    HSM = "hsm",
}

/**
 * @param clientId - subscription client id
 * @param clientSecret - subscription client secret
 * @param subscription - subscription code
 */
export class WaasApi extends WaasAxiosInstance {

    constructor(clientId: string, clientSecret: string, subscription: string) {

        if (!clientId) {
            throw new AuthenticationError("missing variable clientId");
        }
        if (!clientSecret) {
            throw new AuthenticationError("missing variable clientSecret");
        }
        if (!subscription) {
            throw new AuthenticationError("missing variable subscription");
        }

        const api = {
            baseURL: "https://api.tangany.com/v1/",
            timeout: 20000,
            headers: {
                "tangany-client-id": clientId,
                "tangany-client-secret": clientSecret,
                "tangany-subscription": subscription,
                "common": {
                    Accept: "application/json",
                },
            },
            responseType: "json",
        };

        const instance = axios.create(api);

        instance.interceptors.response.use((response: AxiosResponse) => {
            debug("interceptors.response", response);

            return response;
        }, async (e: AxiosError) => {
            if (e.response) {
                debug("interceptors.response.error", e.response.status, e.response.data);

                if (e.response.status === 401) {
                    throw new AuthenticationError(e.response.data.message);
                }

            } else if (e.request) {
                debug("interceptors.request.error", e.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                debug("interceptors.error", e.message, JSON.stringify(e.config));
            }

            throw e;
        });

        super(instance);

    }

    /**
     * get wallet based api calls
     */
    get wallet(): Wallet {
        return new Wallet(this.instance);
    }

    /**
     * get ethereum based api calls
     */
    get ethereum(): Ethereum {
        return new Ethereum(this.instance);
    }
}
