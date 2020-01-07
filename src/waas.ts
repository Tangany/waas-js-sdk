import axios, {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse} from "axios";
import Bottleneck from "bottleneck";
import * as Debug from "debug";
import {Bitcoin} from "./btc";
import {BlockchainTransactionStatuses, IBlockchainTransactionStatus, IWaasError} from "./interfaces";
import {limiter} from "./limiter";
import {Wallet} from "./wallet";
import {Ethereum} from "./eth";
import {AuthenticationError, NotFoundError, GeneralError, ConflictError, TimeoutError, MiningError} from "./errors";
import * as t from "typeforce";
import Timeout = NodeJS.Timeout;

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
    clientId: string;
    clientSecret: string;
    subscription: string;
    vaultUrl?: string;
    ethereumNetwork?: EthereumPublicNetwork | string;
    ethereumTxSpeed?: EthereumTxSpeed;
    ethereumTxConfirmations?: BlockchainTxConfirmations;
    bitcoinNetwork?: BitcoinNetwork;
    bitcoinTxConfirmations?: BlockchainTxConfirmations;
    bitcoinTxSpeed?: BitcoinTxSpeed;
    bitcoinMaxFeeRate?: number;
}

export const recipientType = t.compile({
    to: "String",
    amount: "String",
});

export const ethereumRecipientType = t.compile({
    to: "String",
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
 * @param options.ethereumNetwork - Public Ethereum network name (@see https://tangany.docs.stoplight.io/api/models/ethereum-public-network) or private Ethereum network url (@see https://tangany.docs.stoplight.io/api/models/ethereum-private-network)
 * @param options.ethereumTxConfirmations - Amount of block confirmations required to consider an Ethereum transaction as valid
 * @param options.ethereumTxSpeed - Amount of additional gas fee that is added to the base gas fee for the given Ethereum network to speed up the mining process of the transaction
 * @param options.bitcoinNetwork - Public Bitcoin network name (@see https://tangany.docs.stoplight.io/api/models/bitcoin-network)
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
     *  Execute the statusGetterCall periodically until timeout and resolves the status
     * @param statusGetterCall - function to fetch the transaction status from a blockchain
     * @param [hash} - transaction hash
     * @param [timeout] - if the statusGetterCall did not resolved during the timeout period (in ms) the function will reject
     * @param [ms] - milliseconds delay between api polling attempts
     */
    public static async waitForTxStatus(statusGetterCall: () => Promise<IWaitForTxStatus>, hash?: string, timeout = 20e3, ms = 400): Promise<IBlockchainTransactionStatus> {
        return new Promise(async (resolve, reject) => {
            let subtimer: Timeout;

            // reject function when the global timer completes;
            const globalTimer = global.setTimeout(() => { // https://github.com/Microsoft/TypeScript/issues/30128
                clearTimeout(subtimer);
                debug("global timeout for waiter");
                reject(new TimeoutError(`Timeout for retrieving transaction status for ${hash || "transaction"}`));

                return;
            }, timeout);

            // poll api
            const pollSafely = () => poll()
                .catch(e => {
                    clearTimeout(globalTimer);
                    reject(e);

                    return;
                });

            const poll = async (): Promise<void> => {
                debug("waiting for getter call");
                const {status, response} = await statusGetterCall();
                debug("received getter response", {status}, response.data);

                switch (status) {
                    case "confirmed":
                        clearTimeout(globalTimer);
                        resolve(response);

                        return;
                    case "error":
                        clearTimeout(globalTimer);
                        reject(new MiningError(response));

                        return;
                    case "pending":
                    default:
                        subtimer = global.setTimeout(pollSafely, ms);
                }
            };

            await pollSafely();
        });
    }

    public instance: AxiosInstance;
    public limiter?: Bottleneck;

    constructor(options: IWaaSOptions, version = ApiVersion.V1, limiterEnabled = true) {

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

        axios.defaults.withCredentials = true;

        const api: AxiosRequestConfig = {
            baseURL: (() => {
                switch (version) {
                    case "1.2.1" as ApiVersion:
                        return "https://api.tangany.com/v1.2.1";
                    case "dev" as ApiVersion:
                        return "http://127.0.0.1:7071/api";
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
        if (options.ethereumTxConfirmations) {
            api.headers["tangany-ethereum-tx-confirmations"] = options.ethereumTxConfirmations;
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

                return response;
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
