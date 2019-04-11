import {WaasAxiosInstance} from "./waas-axios-instance";
import {AxiosInstance, AxiosResponse} from "axios";
import {ITokenBalance, ITransaction} from "./interfaces";

/**
 * @param instance - api instance created by a new WaasApi instance
 * @param wallet - name of the wallet to run erc20 token methods on
 * @param address - ethereum contract address of the erc20 token.
 */
export class EthErc20Token extends WaasAxiosInstance {

    public readonly address: string;
    public readonly wallet: string;

    constructor(instance: AxiosInstance, wallet: string, address: string) {
        super(instance);

        if (!wallet) {
            throw new Error("missing wallet arg");
        }
        if (!address) {
            throw new Error("missing address arg");
        }

        this.wallet = wallet;
        this.address = address;
    }

    /**
     * Retrieves the token balance for given wallet
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum-erc20/get-token-balance}
     */
    public async getTokenBalance(): Promise<AxiosResponse<ITokenBalance>> {

        return this.instance
            .get(`eth/erc20/${this.address}/${this.wallet}`)
            .catch(this.catch404.bind(this))
            ;
    }

    /**
     * Send ERC20 tokens from given wallet to an Ethereum address
     * @param recipientAddress - ethereum address of the token recipient. Not to confuse with the token address,
     * @param amount - float amount of tokens formatted as string
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum-erc20/make-token-transaction}
     */
    public async sendToken(recipientAddress: string, amount: string): Promise<AxiosResponse<ITransaction>> {
        return this.instance
            .post(`eth/erc20/${this.address}/${this.wallet}/send`, {
                to: recipientAddress,
                amount,
            })
            ;
    }
}
