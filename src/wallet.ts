import * as t from "typeforce";
import {BtcWallet} from "./btc-wallet";
import {ConflictError, GeneralError} from "./errors";
import {Waas} from "./waas";
import {ISoftDeletedWallet, IWallet, IWalletList} from "./interfaces";
import {EthWallet} from "./eth-wallet";
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
     * @see {@link https://tangany.docs.stoplight.io/api/wallet/list-wallets}
     */
    public async list(skiptoken?: string): Promise<IWalletList> {
        t("?String", skiptoken);

        let url = "wallet";
        if (skiptoken) {
            url += `?skiptoken=${skiptoken}`;
        }

        return this.waas.wrap.bind(this)<IWalletList>(() => this.waas.instance
            .get(url),
        );
    }

    /**
     * Creates a new wallet
     * @param [wallet] - Wallet name that can be linked to a user identifier
     * @param [useHsm] - Use a hardware secure module to store the wallet private key
     * @see {@link https://tangany.docs.stoplight.io/api/wallet/create-wallet}
     */
    public async create(wallet?: string, useHsm?: boolean): Promise<IWallet> {
        t("?String", wallet);
        t("?Boolean", useHsm);

        return this.waas.wrap<IWallet>(() => this.waas.instance
            .post("wallet", {
                wallet,
                useHsm,
            })
            .catch(e => {
                if (e.response && e.response.status === 409) {
                    throw new ConflictError("Cannot overwrite existing wallet");
                }

                throw new GeneralError(e);
            }),
        );
    }

    /**
     * Soft-deletes a wallet so not writing operations cannot be executed for the associated blockchain account. Wallet recovery endpoints are not yet implemented into the API. Contact the support team to recover soft-deleted wallets during the retention period.
     * @see {@link https://tangany.docs.stoplight.io/api/wallet/delete-wallet}
     */
    public async delete(): Promise<ISoftDeletedWallet> {
        return this.waas.wrap<ISoftDeletedWallet>(() => this.waas.instance
            .delete(`wallet/${this.wallet}`),
        );
    }

    /**
     * Returns information for given wallet name
     * @see {@link https://tangany.docs.stoplight.io/api/wallet/get-wallet}
     */
    public async get(): Promise<IWallet> {
        return this.waas.wrap<IWallet>(() => this.waas.instance
            .get(`wallet/${this.wallet}`),
        );
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
