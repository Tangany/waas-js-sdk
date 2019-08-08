import * as t from "typeforce";
import {recipientType} from "./helpers"
import {WaasAxiosInstance} from "./waas-axios-instance";
import {AxiosInstance} from "axios";
import {IWalletBalance, ITransaction, IRecipient} from "./interfaces";
import {EthErc20Wallet} from "./eth-erc20-wallet";
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

    get wallet() {
        t("String", this.walletInstance.wallet);

        return this.walletInstance.wallet;
    }

    /**
     * Returns wallet metrics for the Ethereum blockchain like ether balance and the address
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum/get-wallet-balance}
     */
    public async get(): Promise<IWalletBalance> {
        return this.instance.get(`eth/wallet/${this.wallet}`);
    }

    /**
     * Send Ether to address from given wallet
     * @param recipient - Recipient configuration
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum/make-wallet-transaction}
     */
    public async send(recipient: IRecipient): Promise<ITransaction> {
        if (!recipient.to) {
            throw new Error("Missing 'to' argument");
        }
        if (!recipient.amount) {
            throw new Error("Missing 'amount' argument");
        }

        t(recipientType, recipient, true);

        return this.instance
            .post(`eth/wallet/${this.wallet}/send`, {
                ...recipient,
            })
            ;
    }

    /**
     * Returns wallet calls for the Ethereum ERC20 token
     * @param tokenAddress - Ethereum ERC20 token address for given eth network
     */
    public erc20(tokenAddress: string): EthErc20Wallet {
        return new EthErc20Wallet(this.instance, this.walletInstance, tokenAddress);
    }
}
