import {AxiosInstance, AxiosResponse} from "axios";
import {BtcWallet} from "./btc-wallet";
import {ConflictError} from "./errors";
import {WaasAxiosInstance} from "./waas-axios-instance";
import {ISoftDeletedWallet, IWallet, IWalletList} from "./interfaces";
import {EthWallet} from "./eth-wallet";

/**
 *  instantiates a new wallet interface
 * @param instance - axios instance created by {@link WaasApi}
 * @param  [wallet) - wallet name
 */
export class Wallet extends WaasAxiosInstance {
    public wallet?: string;

    constructor(instance: AxiosInstance, wallet?: string) {
        super(instance);
        this.wallet = wallet;
    }

    /**
     * Lists all wallets for current clientId.
     * @param [skiptoken] - skiptoken value returned in the api response to fetch the next batch of wallets
     * @see {@link https://tangany.docs.stoplight.io/api/wallet/list-wallets}
     */
    public async list(skiptoken?: string): Promise<AxiosResponse<IWalletList>> {
        let url = "wallet";
        if (skiptoken) {
            url += `?skiptoken=${skiptoken}`;
        }

        return this.instance
            .get(url)
            ;
    }

    /**
     * Creates a new wallet
     * @param [wallet] - wallet name that can be linked to a user. E.g. the userId
     * @param useHsm - use hardware secure module to store the wallet private key
     * @see {@link https://tangany.docs.stoplight.io/api/wallet/create-wallet}
     */
    public async create(wallet?: string, useHsm = false): Promise<AxiosResponse<IWallet>> {

        return this.instance
            .post("wallet", {
                wallet,
                useHsm,
            })
            .catch(e => {
                if (e.response && e.response.status === 409) {
                    throw new ConflictError("Cannot overwrite existing wallet");
                }
                throw e;
            })
            ;
    }

    /**
     * Soft-deletes a wallet so not writing operations cannot be executed for the associated blockchain account. Wallet recovery endpoints are not yet implemented into the API. Contact the support team to recover soft-deleted wallets during the retention period.
     * @see {@link https://tangany.docs.stoplight.io/api/wallet/delete-wallet}
     */
    public async delete(): Promise<AxiosResponse<ISoftDeletedWallet>> {
        if (!this.wallet) {
            throw new Error("missing instance variable wallet");
        }

        return this.instance
            .delete(`wallet/${this.wallet}`)
            .catch(this.catch404.bind(this))
            ;
    }

    /**
     * Returns information for given wallet name
     * @see {@link https://tangany.docs.stoplight.io/api/wallet/get-wallet}
     */
    public async get(): Promise<AxiosResponse<IWallet>> {
        if (!this.wallet) {
            throw new Error("missing instance variable wallet");
        }

        return this.instance
            .get(`wallet/${this.wallet}`)
            .catch(this.catch404.bind(this))
            ;
    }

    /**
     * Returns wallet calls for the Ethereum blockchain
     */
    public eth(): EthWallet {
        return new EthWallet(this.instance, this);
    }
    /**
     * Returns wallet calls for the Bitcoin blockchain
     */
    public btc(): BtcWallet {
        return new BtcWallet(this.instance, this);
    }
}
