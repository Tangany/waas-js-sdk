import axios, {AxiosError, AxiosResponse} from "axios";
import * as Debug from "debug";
import {Wallet} from "./wallet";
import {WaasAxiosInstance} from "./waas-axios-instance";
import {Ethereum} from "./eth";
import {AuthenticationError, NotFoundError, GeneralError, ConflictError} from "./errors";

const debug = Debug("waas-js-sdk:main");

export enum WalletVersion {
    LATEST = "latest",
}

export enum WalletSecurity {
    SOFTWARE = "software",
    HSM = "hsm",
}

export enum EthereumPublicNetwork {
    MAINNET = "mainnet",
    ROPSTEN = "ropsten",
}

export enum EthereumTxSpeed {
    DEFAULT = "default",
    FAST = "fast",
    SLOW = "slow",
    NONE = "none",
}

/**
 * @param options - api options
 * @param options.clientId - subscription client id
 * @param options.clientSecret - subscription client secret
 * @param options.subscription - subscription code
 * @param options.vaultUrl - tangany vault url
 * @param options.ethereumNetwork - public ethereum network name (@see https://tangany.docs.stoplight.io/api/models/ethereum-public-network) or private ethereum network url (@see https://tangany.docs.stoplight.io/api/models/ethereum-private-network)
 */
export class WaasApi extends WaasAxiosInstance {

    constructor(
        {
            clientId,
            clientSecret,
            subscription,
            vaultUrl,
            ethereumNetwork,
            ethereumTxSpeed,
        }:
            {
                clientId: string,
                clientSecret: string,
                subscription: string,
                vaultUrl?: string,
                ethereumNetwork?: EthereumPublicNetwork | string,
                ethereumTxSpeed?: EthereumTxSpeed,
            },
    ) {

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

        if (vaultUrl) {
            api.headers["tangany-vault-url"] = vaultUrl;
        }
        if (ethereumNetwork) {
            api.headers["tangany-ethereum-network"] = ethereumNetwork;
        }
        if (ethereumTxSpeed) {
            api.headers["tangany-ethereum-tx-speed"] = ethereumTxSpeed;
        }

        const instance = axios.create(api);

        instance.interceptors.response.use((response: AxiosResponse) => {
            debug("interceptors.response", response);

            return response;
        }, async (e: AxiosError) => {
            if (e.response) {
                debug("interceptors.response.error", e.response.status, e.response.data);

                switch (e.response.status) {
                    case 401:
                        throw new AuthenticationError(e.response.data.message);
                    case 409:
                        throw new ConflictError(e.response.data.message);
                    case 404:
                        throw new NotFoundError(e.response.data.message);
                    default:
                        throw new GeneralError(e.response.status, e.response.data.message);
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
