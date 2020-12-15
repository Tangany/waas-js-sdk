import * as t from "typeforce";
import {BtcWallet} from "./btc-wallet";
import {EthWallet} from "./eth-wallet";
import {ISignatureResponse, ISoftDeletedWallet, IWallet, IWalletList, SignatureEncoding} from "./interfaces";
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
     * Lists all wallets for current clientId.
     * @param [skiptoken] - "skiptoken" value returned in the api response to fetch the next batch of wallets
     * @see [docs]{@link https://docs.tangany.com/#5f27c76b-48a1-45d1-9d8b-44d5afbb1ef3}
     */
    public async list(skiptoken?: string): Promise<IWalletList> {
        t("?String", skiptoken);

        let url = "wallet";
        if (skiptoken) {
            url += `?skiptoken=${skiptoken}`;
        }

        return this.waas.wrap<IWalletList>(() => this.waas.instance
            .get(url),
        );
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
