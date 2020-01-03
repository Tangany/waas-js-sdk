import * as t from "typeforce";
import {recipientType, Waas} from "./waas";
import {IWalletBalance, ITransaction, IRecipient} from "./interfaces";
import {EthErc20Wallet} from "./eth-erc20-wallet";
import {IWaasMethod} from "./waas-method";
import {Wallet} from "./wallet";

/**
 * Instantiates a new Ethereum wallet interface
 * @param instance - axios instance created by {@link Waas}
 * @param limiter - Bottleneck limiter instance
 * @param walletInstance - instance of Wallet class
 */
export class EthWallet implements IWaasMethod {
    private readonly walletInstance: Wallet;

    constructor(public waas: Waas, walletInstance: Wallet) {
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
        return this.waas.wrap<IWalletBalance>(() => this.waas.instance
            .get(`eth/wallet/${this.wallet}`),
        );
    }

    /**
     * Send Ether to address from given wallet
     * @param recipient - Recipient configuration
     * @param recipient.to - Recipient's Ethereum address
     * @param recipient.amount - Amount of Ether to send
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

        return this.waas.wrap<ITransaction>(() => this.waas.instance
            .post(`eth/wallet/${this.wallet}/send`, {
                ...recipient,
            }),
        )
            ;
    }

    /**
     * Returns wallet calls for the Ethereum ERC20 token
     * @param tokenAddress - Ethereum ERC20 token address for given eth network
     */
    public erc20(tokenAddress: string): EthErc20Wallet {
        return new EthErc20Wallet(this.waas, this.walletInstance, tokenAddress);
    }
}
