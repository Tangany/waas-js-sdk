import {WaasAxiosInstance} from "./waas-axios-instance";
import {AxiosInstance, AxiosResponse} from "axios";
import {ITokenBalance, ITransaction} from "./interfaces";
import {Wallet} from "./wallet";

/**
 *  instantiates a new ethereum rc20 wallet interface
 * @param instance - axios instance created by {@link WaasApi}
 * @param walletInstance - instance of Wallet class
 * @param address - erc20 token contract address
 */
export class EthErc20Token extends WaasAxiosInstance {

    public readonly address: string;
    public readonly walletInstance: Wallet;

    constructor(instance: AxiosInstance, walletInstance: Wallet, address: string) {
        super(instance);

        if (!walletInstance) {
            throw new Error("missing wallet arg");
        }
        if (!address) {
            throw new Error("missing address arg");
        }

        this.walletInstance = walletInstance;
        this.address = address;
    }

    /**
     * Retrieves the token balance for given wallet
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum-erc20/get-token-balance}
     */
    public async get(): Promise<AxiosResponse<ITokenBalance>> {
        if (!this.walletInstance.wallet) {
            throw new Error("missing wallet variable in Wallet instance");
        }

        return this.instance
            .get(`eth/erc20/${this.address}/${this.walletInstance.wallet}`)
            .catch(this.catch404.bind(this))
            ;
    }

    /**
     * Send ERC20 tokens from given wallet to an Ethereum address
     * @param recipientAddress - eth address of the token recipient. Not to confuse with the token address,
     * @param amount - float amount of tokens formatted as string
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum-erc20/make-token-transaction}
     */
    public async send(recipientAddress: string, amount: string): Promise<AxiosResponse<ITransaction>> {
        if (!this.walletInstance.wallet) {
            throw new Error("missing wallet variable in Wallet instance");
        }

        return this.instance
            .post(`eth/erc20/${this.address}/${this.walletInstance.wallet}/send`, {
                to: recipientAddress,
                amount,
            })
            ;
    }
}
