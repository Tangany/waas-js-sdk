import * as t from "typeforce";
import {BtcWallet} from "./btc-wallet";
import {EthWallet} from "./eth-wallet";
import {ISearchOptions} from "./interfaces/common";
import {ISignatureResponse, ISignatureVerificationResponse} from "./interfaces/signature";
import {
    ISoftDeletedWallet,
    IWallet,
    IWalletCreationBody,
    IWalletCreationProperties,
    IWalletList,
    IWalletSearchParams
} from "./interfaces/wallet";
import {WalletIterable} from "./iterables/auto-pagination/wallet-iterable";
import {WalletPageIterable} from "./iterables/pagewise/wallet-page-iterable";
import {AtLeastOne, SignatureEncoding} from "./types/common";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";

/** Custom type for partial wallet updates that requires at least one property */
type WalletUpdateValues = AtLeastOne<Omit<IWalletCreationProperties, "wallet" | "useHsm">>;

/** Custom type for wallet replacements */
type WalletReplaceValues = Omit<IWalletCreationProperties, "wallet">;

/**
 *  Instantiates a new wallet interface
 * @param instance - axios instance created by {@link Waas}
 * @param limiter - Bottleneck limiter instance
 * @param  [wallet) - wallet name
 */
export class Wallet implements IWaasMethod {

    /**
     * Converts SDK-specific objects for wallet tags into objects compatible with the API.
     * @param tags - SDK-side wallet tags to be converted
     */
    private static convertTags(tags: IWalletCreationProperties["tags"]): IWalletCreationBody["tags"] {
        // Ideally, we would have used typeforce to validate the type here as well, but for this somewhat more complex type, that doesn't seem to be so easy
        return tags?.map(x => ({[x.name]: x.value}));
    }

    constructor(public waas: Waas, private readonly name?: string) {
        t("?String", name);
    }

    public get wallet() {
        t("String", this.name);

        return this.name;
    }

    /**
     * Lists all wallets for the current client.
     */
    public async list(): Promise<IWalletList>;

    /**
     * Lists all wallets for the current client.
     * @param [skiptoken] - "skiptoken" value returned in the API response to fetch the next batch of wallets
     * @see [docs]{@link https://docs.tangany.com/#5f27c76b-48a1-45d1-9d8b-44d5afbb1ef3}
     * @deprecated Use the method overload with {@link IWalletSearchParams} instead.
     */
    // Ignore the Lint warning because the overload with no arguments (i.e. .list()) should be intentionally documented differently than this one.
    // tslint:disable-next-line:unified-signatures
    public async list(skiptoken?: string): Promise<IWalletList>;

    /**
     * Returns an asynchronous iterable to iterate the wallets of the current client pagewise.
     * @see [docs]{@link https://docs.tangany.com/#72b95742-6682-4dae-a802-4bbd504df9f4}
     * @param [params] - Optional search parameters
     */
    public list(params?: IWalletSearchParams): WalletPageIterable;

    /**
     * Returns an asynchronous iterable that yields **one wallet per iteration**.
     * A page of wallets that match the search parameters is fetched and saved once, so that all items can be returned one by one.
     * After that, the next page is loaded from the API and processed item by item again.
     * @param [params] - Optional search parameters
     * @param [options] - Additional options that do not affect the API request but the SDK-side processing
     * @see [docs]{@link https://docs.tangany.com/#72b95742-6682-4dae-a802-4bbd504df9f4}
     */
    public list(params?: IWalletSearchParams, options?: { autoPagination: true }): WalletIterable;

    /**
     * Returns an asynchronous iterable to iterate **page by page** through the wallets that matched the search parameters.
     * @param [params] - Optional search parameters
     * @param [options] - Additional options that do not affect the API request but the SDK-side processing
     * @see [docs]{@link https://docs.tangany.com/#72b95742-6682-4dae-a802-4bbd504df9f4}
     */
    // tslint:disable-next-line:unified-signatures
    public list(params?: IWalletSearchParams, options?: ISearchOptions): WalletPageIterable;

    public list(arg?: string | IWalletSearchParams, options?: ISearchOptions): Promise<IWalletList> | WalletPageIterable | WalletIterable {
        // The first and second overload continue to use the deprecated endpoint to avoid breaking changes
        if (arg === undefined || typeof arg === "string") {
            const url = `wallet${arg ? `?skiptoken=${arg}` : ""}`;
            return this.waas.wrap<IWalletList>(() => this.waas.instance.get(url));
        }
        // All other overloads expect an object as first argument
        else if (arg !== null && typeof arg === "object") {
            const initialRequest = {url: "wallets", params: arg};
            if (options?.autoPagination) {
                return new WalletIterable(this.waas, initialRequest);
            } else {
                return new WalletPageIterable(this.waas, initialRequest);
            }
        }
        throw new Error("The passed argument for wallet search is invalid");
    }

    /**
     * Creates a new wallet
     * @param [wallet] - Values to configure the wallet to create
     * @see [docs]{@link https://docs.tangany.com/#9524e598-b645-4a44-9036-c874e22be3a7}
     */
    public async create(wallet?: IWalletCreationProperties): Promise<IWallet>;

    /**
     * Creates a new wallet
     * @param [wallet] - Wallet name that can be linked to a user identifier
     * @param [useHsm] - Use a hardware secure module to store the wallet private key
     * @deprecated Use the method overload with {@link IWalletCreationProperties} instead
     */
    public async create(wallet?: string, useHsm?: boolean): Promise<IWallet>;

    public async create(wallet?: string | IWalletCreationProperties, useHsm?: boolean): Promise<IWallet> {
        let reqBody: IWalletCreationBody;
        if (wallet === undefined) {
            reqBody = {};
        } else if (typeof wallet === "string") {
            t("?Boolean", useHsm);
            reqBody = {wallet, useHsm};
        } else if (typeof wallet === "object" && !Array.isArray(wallet)) {
            reqBody = {
                wallet: wallet.wallet,
                useHsm: wallet.useHsm,
                tags: Wallet.convertTags(wallet.tags),
            }
        } else {
            throw new Error("The passed arguments does not match a valid method overload");
        }
        return this.waas.wrap<IWallet>(() => this.waas.instance.post("wallets", reqBody));
    }

    /**
     * Updates the given wallet without regenerating the cryptographic keys.
     * @param newValues - Subset of wallet properties that are allowed to be updated. Non-primitive properties like arrays or objects replace the previous value and therefore need to contain all desired values.
     * @see [docs]{@link https://docs.tangany.com/#05339c0f-8cc9-48d2-91e0-c9240764dc53}
     */
    public async update(newValues: WalletUpdateValues): Promise<IWallet> {
        t("Object", newValues);
        const reqBody = {
            ...newValues,
            tags: Wallet.convertTags(newValues.tags),
        }
        return this.waas.wrap<IWallet>(() => this.waas.instance.patch(`wallet/${this.wallet}`, reqBody));
    }

    /**
     * Creates a new version of the current wallet. It generates new keys and therefore disables "write" operations of the previous wallet version to the blockchain.
     * @param [wallet] - Object to overwrite the existing wallet
     * @see [docs]{@link https://docs.tangany.com/#73451025-c889-4d94-b424-fbe2a3f9999f}
     */
    public async replace(wallet?: WalletReplaceValues): Promise<IWallet>;

    /**
     * Creates a new version of the current wallet. It generates new keys and therefore disables "write" operations of the previous wallet version to the blockchain.
     * @param [useHsm] - Use a hardware secure module to store the wallet private key
     * @see [docs]{@link https://docs.tangany.com/#73451025-c889-4d94-b424-fbe2a3f9999f}
     * @deprecated Use the method overload with {@link WalletReplaceValues} instead
     */
    // tslint:disable-next-line:unified-signatures
    public async replace(useHsm?: boolean): Promise<IWallet>;

    public async replace(arg?: boolean | WalletReplaceValues): Promise<IWallet> {
        let reqBody: Omit<IWalletCreationBody, "wallet">;
        if (arg === undefined) {
            reqBody = {};
        } else if (typeof arg === "boolean") {
            reqBody = {useHsm: arg};
        } else if (typeof arg === "object" && !Array.isArray(arg)) {
            reqBody = {
                useHsm: arg.useHsm,
                tags: Wallet.convertTags(arg.tags),
            }
        } else {
            throw new Error("The passed arguments does not match a valid method overload");
        }
        return this.waas.wrap<IWallet>(() => this.waas.instance.put(`wallet/${this.wallet}`, reqBody));
    }

    /**
     * Soft-deletes a wallet so not writing operations cannot be executed for the associated blockchain account. Wallet recovery endpoints are not yet implemented into the API. Contact the support team to recover soft-deleted wallets during the retention period.
     * @see [docs]{@link https://docs.tangany.com/#e0b207c8-5cdc-4dce-af6d-a6a655a1cf20}
     */
    public async delete(): Promise<ISoftDeletedWallet> {
        return this.waas.wrap<ISoftDeletedWallet>(() => this.waas.instance
            .delete(`wallet/${this.wallet}`),
        );
    }

    /**
     * Returns information for given wallet name
     * @see [docs]{@link https://docs.tangany.com/#f95ba7a2-5526-4eef-b0da-7d7a13be34d2}
     */
    public async get(): Promise<IWallet> {
        return this.waas.wrap<IWallet>(() => this.waas.instance
            .get(`wallet/${this.wallet}`),
        );
    }

    /**
     * Signs the SHA2-256 hash of the given payload string using the ES256K algorithm.
     * If a format is specified, the signature is encoded with it, otherwise DER is used by default.
     * The result is then returned as base64 text.
     * @param payload - Payload string to be signed
     * @param [encoding] - Signature encoding to be used (`der` or `ieee-p1363`), where `der` is the default
     */
    public async sign(payload: string, encoding?: SignatureEncoding): Promise<string> {
        const body = {
            payload,
            ...encoding && {encoding}
        };

        const {signature} = await this.waas.wrap<ISignatureResponse>(() => this.waas.instance
            .post(`wallet/${this.wallet}/sign`, body),
        );

        return signature;
    }

    /**
     * Verifies the SHA2-256 hash of the passed payload string against the given signature.
     * By default, the signature is expected in DER format, but the encoding used can also be passed explicitly.
     * @param payload - Payload to be compared against the passed signature
     * @param signature - Signature to be verified
     * @param [encoding] - Encoding used for the passed signature (`der` by default)
     */
    public async verifySignature(payload: string, signature: string, encoding?: SignatureEncoding): Promise<boolean> {
        const body = {
            payload,
            signature,
            ...encoding && {encoding}
        };

        const {isValid} = await this.waas.wrap<ISignatureVerificationResponse>(() => this.waas.instance
            .post(`wallet/${this.wallet}/verify`, body),
        );

        return isValid;
    }


    /**
     * Returns wallet calls for the Ethereum blockchain
     */
    public eth(): EthWallet {
        const ew = new EthWallet(this.waas, this);

        return ew;
    }

    /**
     * Returns wallet calls for the Bitcoin blockchain
     */
    public btc(): BtcWallet {
        const btc = new BtcWallet(this.waas, this);

        return btc;
    }
}
