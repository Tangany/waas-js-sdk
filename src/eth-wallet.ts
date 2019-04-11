import {WaasAxiosInstance} from "./waas-axios-instance";
import {AxiosInstance, AxiosResponse} from "axios";
import {IEthWalletBalance, ITransaction} from "./interfaces";

/**
 * Class representing Ethereum endpoints for a wallet
 * @param instance - api instance created by a WaasApi instance
 * @param wallet - wallet name
 */
export class EthWallet extends WaasAxiosInstance {

    public readonly wallet: string;

    constructor(instance: AxiosInstance, wallet: string) {
        super(instance);
        if (!wallet) {
            throw new Error("missing wallet arg");
        }
        this.wallet = wallet;
    }

    /**
     * Returns wallet metrics for the Ethereum blockchain like ether balance and the address
     * @param wallet - wallet name
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum/get-wallet-balance}
     */
    public async getWalletBalance(): Promise<AxiosResponse<IEthWalletBalance>> {
        return this.instance
            .get(`eth/wallet/${this.wallet}`)
            .catch(this.catch404.bind(this))
            ;
    }

    /**
     * Send ether to address from given wallet
     * @param to - recipient ethereum address
     * @param amount - amount of eth to send in transaction
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum/make-wallet-transaction}
     */
    public async send(to: string, amount: string): Promise<AxiosResponse<ITransaction>> {
        if (!to) {
            throw new Error("missing to arg");
        }
        if (!amount) {
            throw new Error("missing amount arg");
        }

        return this.instance
            .post(`eth/wallet/:wallet/${this.wallet}`, {
                to,
                amount,
            })
            .catch(this.catch404.bind(this))
            ;
    }
}
