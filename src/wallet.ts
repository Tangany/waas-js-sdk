import * as t from "typeforce";
import {BtcWallet} from "./btc-wallet";
import {EthWallet} from "./eth-wallet";
import {ISignatureResponse, ISignatureVerificationResponse} from "./interfaces/signature";
import {ISoftDeletedWallet, IWallet, IWalletList, IWalletSearchParams} from "./interfaces/wallet";
import {WalletPageIterable} from "./iterables/wallet-page-iterable";
import {SignatureEncoding} from "./types/common";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";

/**
 *  Instantiates a new wallet interface
 * @param instance - axios instance created by {@link Waas}
 * @param limiter - Bottleneck limiter instance
 * @param  [wallet) - wallet name
 */
export class Wallet implements IWaasMethod {
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

    public list(arg?: string | IWalletSearchParams): Promise<IWalletList> | WalletPageIterable {
        // The first and second overload continue to use the deprecated endpoint to avoid breaking changes
        if (arg === undefined || typeof arg === "string") {
            const url = `wallet${arg ? `?skiptoken=${arg}` : ""}`;
            return this.waas.wrap<IWalletList>(() => this.waas.instance.get(url));
        }
        // The third overload utilizes the new endpoint and uses an asynchronous iterable
        else if (arg !== null && typeof arg === "object") {
            return new WalletPageIterable(this.waas, {url: "wallets", params: arg});
        }
        throw new Error("The passed argument for wallet search is invalid");
    }

    /**
     * Creates a new wallet
     * @param [wallet] - Wallet name that can be linked to a user identifier
     * @param [useHsm] - Use a hardware secure module to store the wallet private key
     * @see [docs]{@link https://docs.tangany.com/#88ca3b1c-fd97-4e92-bc42-89c5744f25d2}
     */
    public async create(wallet?: string, useHsm?: boolean): Promise<IWallet> {
        t("?String", wallet);
        t("?Boolean", useHsm);

        return this.waas.wrap<IWallet>(() => this.waas.instance.post("wallet", {wallet, useHsm,}));
    }

    /**
     * Creates a new version of the current wallet. It generates new keys and therefore disables "write" operations of the previous wallet version to the blockchain.
     * @param [useHsm] - Use a hardware secure module to store the wallet private key
     * @see [docs]{@link https://docs.tangany.com/#73451025-c889-4d94-b424-fbe2a3f9999f}
     */
    public async replace(useHsm?: boolean): Promise<IWallet> {
        t("?Boolean", useHsm);
        return this.waas.wrap<IWallet>(() => this.waas.instance.put(`wallet/${this.wallet}`, {useHsm}));
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
