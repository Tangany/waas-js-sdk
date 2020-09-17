import axios, {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse} from "axios";
import Bottleneck from "bottleneck";
import * as Debug from "debug";
import * as t from "typeforce";
import {Bitcoin} from "./btc";
import {AuthenticationError, ConflictError, GeneralError, MiningError, NotFoundError} from "./errors";
import {Ethereum} from "./eth";
import {
    BlockchainTransactionStatuses,
    IBlockchainTransactionStatus,
    IWaasError
} from "./interfaces";
import {limiter} from "./limiter";
import {Request} from "./request"
import {Wallet} from "./wallet";
import {poll} from "./polling-helper";

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

export enum BlockchainTxConfirmations {
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
    clientId?: string;
    clientSecret?: string;
    subscription?: string;
    vaultUrl?: string; // can be omitted for non-custodian calls (e.g. check transaction status)
    ethereumNetwork?: EthereumPublicNetwork | string;
    ethereumTxSpeed?: EthereumTxSpeed;
    ethereumTxConfirmations?: BlockchainTxConfirmations;
    ethereumGasPrice?: string;
    ethereumGas?: number;
    ethereumNonce?: number;
    useGasTank?: boolean;
    bitcoinNetwork?: BitcoinNetwork;
    bitcoinTxConfirmations?: BlockchainTxConfirmations;
    bitcoinTxSpeed?: BitcoinTxSpeed;
    bitcoinMaxFeeRate?: number;
}

export const recipientType = t.compile({
    to: "?String",
    wallet: "?String",
    amount: "String",
});

export const ethereumRecipientType = t.compile({
    to: "?String",
    wallet: "?String",
    amount: "String",
    data: "?String",
});

export interface IWaitForTxStatus {
    status: BlockchainTransactionStatuses;
    response: IBlockchainTransactionStatus;
}

/**
 * Instantiates a new API interface. Multiple instances with different settings can run in parallel
 * @param options - api options
 * @param options.clientId - Subscription client id
 * @param options.clientSecret - Subscription client secret
 * @param options.subscription - Subscription code
 * @param options.vaultUrl - Tangany vault url
 * @param options.ethereumNetwork - Public Ethereum network name or private Ethereum network url
 * @param options.ethereumTxConfirmations - Amount of block confirmations required to consider an Ethereum transaction as valid
 * @param options.ethereumTxSpeed - Amount of additional gas fee that is added to the base gas fee for the given Ethereum network to speed up the mining process of the transaction
 * @param options.bitcoinNetwork - Public Bitcoin network name
 * @param options.bitcoinTxConfirmations - Amount of block confirmations required for Bitcoin balance outputs to be included in the total wallet balance calculation
 * @param options.bitcoinTxSpeed - Target amount of block confirmations for the transaction to be included to the Bitcoin network
 * @param options.bitcoinMaxFeeRate - Maximum allowed fee rate in satoshi per byte for a Bitcoin transaction
 * @param version - WaaS API version
 * @param limiterEnabled - Enable API throttling limiter
 */
export class Waas {

    /**
     * Exposes the preconfigured AxiosInstance for arbitrary api calls
     */
    public get axios() {
        return this.instance;
    }

    /**
     * Execute the statusGetterCall periodically until timeout and resolves the status
     * @param statusGetterCall - function to fetch the transaction status from a blockchain
     * @param [hash} - transaction hash
     * @param [timeout] - if the statusGetterCall did not resolved during the timeout period (in ms) the function will reject
     * @param [ms] - milliseconds delay between api polling attempts
     */
    public static async waitForTxStatus(statusGetterCall: () => Promise<IBlockchainTransactionStatus>, hash?: string, timeout = 20e3, ms = 400): Promise<IBlockchainTransactionStatus> {
        const validate = (s: IBlockchainTransactionStatus) => {
            switch (s.status) {
                case "confirmed":
                    return true
                case "error":
                    throw new MiningError(s);
                case "pending":
                default:
                    return false;
            }
        }

        return poll<IBlockchainTransactionStatus>(statusGetterCall, validate, `transaction status ${hash}`, timeout, ms)
    }

    public instance: AxiosInstance;
    public limiter?: Bottleneck;

    constructor(options?: IWaaSOptions, version = ApiVersion.V1, limiterEnabled = true) {
        const _options: IWaaSOptions = {
            clientId: process.env.TANGANY_CLIENT_ID as string,
            clientSecret: process.env.TANGANY_CLIENT_SECRET as string,
            subscription: process.env.TANGANY_SUBSCRIPTION as string,
            vaultUrl: process.env.TANGANY_VAULT_URL as string,
            ...options,
        };

        if (!_options.clientId) {
            throw new AuthenticationError("Missing variable 'clientId'");
        }
        if (!_options.clientSecret) {
            throw new AuthenticationError("Missing variable 'clientSecret'");
        }
        if (!_options.subscription) {
            throw new AuthenticationError("Missing variable 'subscription'");
        }

        t({
            clientId: "String",
            clientSecret: "String",
            subscription: "String",
            vaultUrl: "?String",
            ethereumNetwork: "?String",
            ethereumTxSpeed: "?String",
            ethereumGasPrice: "?String",
            ethereumGas: "?Number",
            ethereumNonce: "?Number",
            useGasTank: "?Boolean",
            bitcoinNetwork: "?String",
            bitcoinTxSpeed: "?String",
            bitcoinTxConfirmations: "?String",
            bitcoinMaxFeeRate: "?Number",
            version: "?Number",
        }, _options, true);

        axios.defaults.withCredentials = true;

        const api: AxiosRequestConfig = {
            baseURL: (() => {
                switch (version) {
                    case ApiVersion.V1:
                        return "https://api.tangany.com/v1";
                    default:
                        return version;
                }
            })(),
            headers: {
                "tangany-client-id": _options.clientId,
                "tangany-client-secret": _options.clientSecret,
                "tangany-subscription": _options.subscription,
                "common": {
                    Accept: "application/json",
                },
            },
            responseType: "json",
        };

        if (_options.vaultUrl) {
            api.headers["tangany-vault-url"] = _options.vaultUrl;
        }
        if (_options.ethereumNetwork) {
            api.headers["tangany-ethereum-network"] = _options.ethereumNetwork;
        }
        if (_options.ethereumTxConfirmations) {
            api.headers["tangany-ethereum-tx-confirmations"] = _options.ethereumTxConfirmations;
        }
        if (_options.ethereumTxSpeed) {
            api.headers["tangany-ethereum-tx-speed"] = _options.ethereumTxSpeed;
        }
        if (_options.ethereumGasPrice) {
            api.headers["tangany-ethereum-gas-price"] = _options.ethereumGasPrice;
        }
        if (_options.ethereumGas){
            api.headers["tangany-ethereum-gas"] = _options.ethereumGas;
        }
        if (_options.ethereumNonce){
            api.headers["tangany-ethereum-nonce"] = _options.ethereumNonce;
        }
        if (_options.useGasTank) {
            api.headers["tangany-use-gas-tank"] = _options.useGasTank;
        }
        if (_options.bitcoinNetwork) {
            api.headers["tangany-bitcoin-network"] = _options.bitcoinNetwork;
        }
        if (_options.bitcoinTxSpeed) {
            api.headers["tangany-bitcoin-tx-speed"] = _options.bitcoinTxSpeed;
        }
        if (_options.bitcoinTxConfirmations) {
            api.headers["tangany-bitcoin-tx-confirmations"] = _options.bitcoinTxConfirmations;
        }
        if (_options.bitcoinMaxFeeRate) {
            api.headers["tangany-bitcoin-max-fee-rate"] = _options.bitcoinMaxFeeRate;
        }

        const instance = axios.create(api);

        // removes axios' proprietary "delete", "get", "head" etc. functions from its headers object
        const filterHeaders = (headers: object) => headers && Object.entries(headers)
            .filter((v: [string, any]) => {
                switch (true) {
                    case v[0] === "common":
                    case typeof v[1] === "string":
                    case v[1].constructor === Array:
                        return true;
                    default:
                        return false;
                }
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

                if (headers && headers.hasOwnProperty("set-cookie")) {
                    const cookie = headers["set-cookie"].map((h: string) => h.split(";")[0]).join("; "); // make cookie available for consequent axios instance calls in current session
                    instance.defaults.headers.cookie = cookie;
                }

                return data;
            },
            async (e: AxiosError<IWaasError>) => {
                if (!e.response) {
                    throw e;
                }

                const {response, message} = e;

                debug("interceptors.response.error", {
                    response: response.data,
                    headers: filterHeaders(response.headers),
                    message,
                });

                const {message: waasMessage, activityId} = response.data;
                switch (e.response.status) {
                    case 401:
                        throw new AuthenticationError(waasMessage, activityId);
                    case 409:
                        throw new ConflictError(waasMessage, activityId);
                    case 404:
                        throw new NotFoundError(waasMessage);
                    default:
                        throw new GeneralError(waasMessage, response.status, activityId);
                }

            });

        this.instance = instance;

        if (limiterEnabled) {
            this.limiter = limiter;
        }
    }

    /**
     * read wallet based api calls
     * @param [name] - wallet name
     */
    public wallet(name?: string): Wallet {
        const w = new Wallet(this, name);

        return w;
    }

    /**
     * read eth based api calls
     * @param [txHash] - Ethereum transaction hash
     */
    public eth(txHash?: string): Ethereum {
        const e = new Ethereum(this, txHash);

        return e;
    }

    /**
     * read btc based api calls
     * @param [txHash] - Bitcoin transaction hash
     */
    public btc(txHash?: string): Bitcoin {
        const b = new Bitcoin(this, txHash);

        return b;
    }

    /**
     * read api calls for asynchronous requests
     * @param id - Unique identifier for an asynchronous request
     */
    public request<T extends Record<string, any>>(id: string): Request<T> {
        return new Request<T>(this, id);
    }

    /**
     * wrap async call to the bottleneck limiter
     * @param fn - function that returns a promise function. Pass the promise function's arguments via the functions argument
     * @param args - promise function arguments
     */
    public async wrap<T>(fn: (args: any) => Promise<T>, ...args: any): Promise<T> {
        if (!this.limiter) {
            // throw new Error("Cannot wrap function without limiter instance");
            return fn(args);
        }

        return this.limiter.schedule(fn, args);
    }
}
