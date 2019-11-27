import axios, {AxiosError, AxiosRequestConfig, AxiosResponse} from "axios";
import * as Debug from "debug";
import {Bitcoin} from "./btc";
import {IWaasError} from "./interfaces";
import {Wallet} from "./wallet";
import {WaasAxiosInstance} from "./waas-axios-instance";
import {Ethereum} from "./eth";
import {AuthenticationError, NotFoundError, GeneralError, ConflictError} from "./errors";
import * as t from "typeforce";

// const limiter = new Bottleneck({
//     reservoir: 100, // 100 requests...
//     reservoirRefreshAmount: 100,
//     reservoirRefreshInterval: 10 * 1e3, // ...per 10s
//     maxConcurrent: 5, // max. 5 simultaneous requests
//     minTime: 10, // delay each request bx 10ms
// });

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

export enum BitcoinNetwork {
    BITCOIN = "bitcoin",
    TESTNET = "testnet",
}

export enum BitcoinTxConfirmations {
    NONE = "none",
    DEFAULT = "default",
    SECURE = "secure",
}

export enum BitcoinTxSpeed {
    SLOW = "slow",
    DEFAULT = "default",
    FAST = "fast",
}

export enum ApiVersion {
    V1 = "v1",
    V2_ALPHA = "v2-alpha",
}

interface IWaaSOptions {
    clientId: string;
    clientSecret: string;
    subscription: string;
    vaultUrl?: string;
    ethereumNetwork?: EthereumPublicNetwork | string;
    ethereumTxSpeed?: EthereumTxSpeed;
    bitcoinNetwork?: BitcoinNetwork;
    bitcoinTxConfirmations?: BitcoinTxConfirmations;
    bitcoinTxSpeed?: BitcoinTxSpeed;
    bitcoinMaxFeeRate?: number;
}

/**
 * Instantiates a new API interface. Multiple instances with different settings can run in parallel
 * @param options - api options
 * @param options.clientId - Subscription client id
 * @param options.clientSecret - Subscription client secret
 * @param options.subscription - Subscription code
 * @param options.vaultUrl - Tangany vault url
 * @param options.ethereumNetwork - Public Ethereum network name (@see https://tangany.docs.stoplight.io/api/models/ethereum-public-network) or private Ethereum network url (@see https://tangany.docs.stoplight.io/api/models/ethereum-private-network)
 * @param options.ethereumTxSpeed - Amount of additional gas fee that is added to the base gas fee for the given Ethereum network to speed up the mining process of the transaction
 * @param options.bitcoinNetwork - Public Bitcoin network name (@see https://tangany.docs.stoplight.io/api/models/bitcoin-network)
 * @param options.bitcoinTxConfirmations - Amount of block confirmations required for Bitcoin balance outputs to be included in the total wallet balance calculation
 * @param options.bitcoinTxSpeed - Target amount of block confirmations for the transaction to be included to the Bitcoin network
 * @param options.bitcoinMaxFeeRate - Maximum allowed fee rate in satoshi per byte for a Bitcoin transaction
 */
export class Waas extends WaasAxiosInstance {

    constructor(options: IWaaSOptions, version = ApiVersion.V1) {

        if (!options.clientId) {
            throw new AuthenticationError("Missing variable 'clientId'");
        }
        if (!options.clientSecret) {
            throw new AuthenticationError("Missing variable 'clientSecret'");
        }
        if (!options.subscription) {
            throw new AuthenticationError("Missing variable 'subscription'");
        }

        t({
            clientId: "String",
            clientSecret: "String",
            subscription: "String",
            vaultUrl: "?String",
            ethereumNetwork: "?String",
            ethereumTxSpeed: "?String",
            bitcoinNetwork: "?String",
            bitcoinTxSpeed: "?String",
            bitcoinTxConfirmations: "?String",
            bitcoinMaxFeeRate: "?Number",
            version: "?Number",
        }, options, true);

        const api: AxiosRequestConfig = {
            baseURL: (() => {
                switch (version) {
                    case ApiVersion.V2_ALPHA:
                        return "https://api.tangany.com/v2-alpha";
                    case ApiVersion.V1:
                    default:
                        return "https://api.tangany.com/v1";
                }
            })(),
            headers: {
                "tangany-client-id": options.clientId,
                "tangany-client-secret": options.clientSecret,
                "tangany-subscription": options.subscription,
                "common": {
                    Accept: "application/json",
                },
            },
            responseType: "json",
        };

        if (options.vaultUrl) {
            api.headers["tangany-vault-url"] = options.vaultUrl;
        }
        if (options.ethereumNetwork) {
            api.headers["tangany-ethereum-network"] = options.ethereumNetwork;
        }
        if (options.ethereumTxSpeed) {
            api.headers["tangany-ethereum-tx-speed"] = options.ethereumTxSpeed;
        }
        if (options.bitcoinNetwork) {
            api.headers["tangany-bitcoin-network"] = options.bitcoinNetwork;
        }
        if (options.bitcoinTxSpeed) {
            api.headers["tangany-bitcoin-tx-speed"] = options.bitcoinTxSpeed;
        }
        if (options.bitcoinTxConfirmations) {
            api.headers["tangany-bitcoin-tx-confirmations"] = options.bitcoinTxConfirmations;
        }
        if (options.bitcoinMaxFeeRate) {
            api.headers["tangany-bitcoin-max-fee-rate"] = options.bitcoinMaxFeeRate;
        }

        const instance = axios.create(api);

        // removes functions from axios headers object
        const filterHeaders = (headers: object) => headers && Object.entries(headers)
            .filter((v: [string, any]) => {
                return typeof v[1] === "string";
            })
            .reduce((o, e) => ({...o, [e[0]]: e[1]}), {});

        instance.interceptors.request.use((req: AxiosRequestConfig) => {
            const {method, url, baseURL, data, headers} = req;
            debug("interceptors.request", {method, url: `${baseURL}/${url}`, data, headers: filterHeaders(headers)});

            return req;
        });

        instance.interceptors.response.use((response: AxiosResponse) => {
            const {headers, data, status, statusText} = response;
            debug("interceptors.response", {
                headers: filterHeaders(headers),
                data,
                status,
                statusText,
            });

            return response;
        }, async (e: AxiosError<IWaasError>) => {
            if (!e.response) {
                throw e;
            }

            const {response, message} = e;

            debug("interceptors.response.error", {
                response: response.data,
                headers: filterHeaders(response.headers),
                message,
            });

            switch (e.response.status) {
                case 401:
                    throw new AuthenticationError(response.data.message);
                case 409:
                    throw new ConflictError(response.data.message);
                case 404:
                    throw new NotFoundError(response.data.message);
                default:
                    throw new GeneralError(response.data.message, response.status);
            }

        });

        super(instance);
    }

    /**
     * Exposes the preconfigured AxiosInstance for arbitrary api calls
     */
    public get axios() {
        return this.instance;
    }

    /**
     * read wallet based api calls
     * @param [name] - wallet name
     */
    public wallet(name?: string): Wallet {
        const w = new Wallet(this.axios, name);

        return w;
    }

    /**
     * read eth based api calls
     * @param [txHash] - Ethereum transaction hash
     */
    public eth(txHash?: string): Ethereum {
        const e = new Ethereum(this.axios, txHash);

        return e;
    }

    /**
     * read btc based api calls
     * @param [txHash] - Bitcoin transaction hash
     */
    public btc(txHash?: string): Bitcoin {
        const b = new Bitcoin(this.axios, txHash);

        return b;
    }
}
