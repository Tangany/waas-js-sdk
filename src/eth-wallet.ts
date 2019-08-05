import {WaasAxiosInstance} from "./waas-axios-instance";
import {AxiosInstance, AxiosResponse} from "axios";
import {IWalletBalance, ITransaction} from "./interfaces";
import {EthErc20Token} from "./eth-erc20-token";
import {Wallet} from "./wallet";

/**
 *  instantiates a new Ethereum wallet interface
 * @param instance - axios instance created by {@link WaasApi}
 * @param walletInstance - instance of Wallet class
 */
export class EthWallet extends WaasAxiosInstance {
    private readonly walletInstance: Wallet;

    constructor(instance: AxiosInstance, walletInstance: Wallet) {
        super(instance);
        this.walletInstance = walletInstance;
    }

    /**
     * Returns wallet metrics for the Ethereum blockchain like ether balance and the address
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum/get-wallet-balance}
     */
    public async get(): Promise<AxiosResponse<IWalletBalance>> {
        if (!this.walletInstance.wallet) {
            throw new Error("missing wallet variable in Wallet instance");
        }

        return this.instance
            .get(`eth/wallet/${this.walletInstance.wallet}`)
            .catch(this.catch404.bind(this))
            ;
    }

    /**
     * Send ether to address from given wallet
     * @param to - recipient eth address
     * @param amount - amount of eth to send in transaction
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum/make-wallet-transaction}
     */
    public async send(to: string, amount: string): Promise<AxiosResponse<ITransaction>> {
        if (!this.walletInstance.wallet) {
            throw new Error("missing wallet variable in Wallet instance");
        }
        if (!to) {
            throw new Error("missing to arg");
        }
        if (!amount) {
            throw new Error("missing amount arg");
        }

        return this.instance
            .post(`eth/wallet/${this.walletInstance.wallet}/send`, {
                to,
                amount,
            })
            .catch(this.catch404.bind(this))
            ;
    }

    /**
     * Returns wallet calls for the Ethereum ERC20 token
     * @param tokenAddress - eth erc20 token address for given eth network
     */
    public erc20(tokenAddress: string): EthErc20Token {
        return new EthErc20Token(this.instance, this.walletInstance, tokenAddress);
    }
}
