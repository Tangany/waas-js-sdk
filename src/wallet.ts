import {AxiosInstance, AxiosResponse} from "axios";
import {ConflictError} from "./errors/conflict-error";
import {WaasAxiosInstance} from "./waas-axios-instance";
import {ISoftDeletedWallet, IWallet, IWalletList} from "./interfaces";
import {EthWallet} from "./eth-wallet";
import {EthErc20Token} from "./eth-erc20-token";

/**
 * Class representing wallet endpoints
 * @param instance - api instance created by a new WaasApi instance
 */
export class Wallet extends WaasAxiosInstance {

    constructor(instance: AxiosInstance) {
        super(instance);
    }

    /**
     * Lists all wallets for current clientId.
     * @param skiptoken - skiptoken value returned in the api response to fetch the next batch of wallets
     * @see {@link https://tangany.docs.stoplight.io/api/wallet/list-wallets}
     */
    public async listWallets(skiptoken?: string): Promise<AxiosResponse<IWalletList>> {
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
     * @param wallet - wallet name that can be linked to a user. E.g. the userId
     * @param useHsm - use hardware secure module to store the wallet private key
     * @see {@link https://tangany.docs.stoplight.io/api/wallet/create-wallet}
     */
    public async createWallet(wallet: string, useHsm = false): Promise<AxiosResponse<IWallet>> {

        if (!wallet) {
            throw new Error("missing wallet arg");
        }

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
     * @param wallet - wallet name
     * @see {@link https://tangany.docs.stoplight.io/api/wallet/delete-wallet}
     */
    public async deleteWallet(wallet: string): Promise<AxiosResponse<ISoftDeletedWallet>> {
        if (!wallet) {
            throw new Error("missing wallet arg");
        }

        return this.instance
            .delete(`wallet/${wallet}`)
            .catch(this.catch404.bind(this))
            ;
    }

    /**
     * Returns information for given wallet name
     * @param wallet - wallet name
     * @see {@link https://tangany.docs.stoplight.io/api/wallet/get-wallet}
     */
    public async getWallet(wallet: string): Promise<AxiosResponse<IWallet>> {
        if (!wallet) {
            throw new Error("missing wallet arg");
        }

        return this.instance
            .get(`wallet/${wallet}`)
            .catch(this.catch404.bind(this))
            ;
    }

    /**
     * Returns wallet calls for the Ethereum blockchain
     * @param walletName - wallet name
     */
    public eth(walletName: string): EthWallet {
        return new EthWallet(this.instance, walletName);
    }

    /**
     * Returns wallet calls for the Ethereum ERC20 token
     * @param walletName - wallet name
     * @param tokenAddress - ethereum erc20 token address for given ethereum network
     */
    public ethErc20(walletName: string, tokenAddress: string): EthErc20Token {
        return new EthErc20Token(this.instance, walletName, tokenAddress);
    }
}
