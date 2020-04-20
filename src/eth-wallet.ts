import * as t from "typeforce";
import {BlockchainWallet} from "./blockchain-wallet"
import {EthContractWallet} from "./eth-contract-wallet"
import {Request} from "./request"
import {ethereumRecipientType, Waas} from "./waas";
import {IWalletBalance, ITransaction, IEthereumRecipient, ITransmittableTransaction} from "./interfaces";
import {EthErc20Wallet} from "./eth-erc20-wallet";
import {Wallet} from "./wallet";

/**
 * Instantiates a new Ethereum wallet interface
 * @param instance - axios instance created by {@link Waas}
 * @param limiter - Bottleneck limiter instance
 * @param walletInstance - instance of Wallet class
 */
export class EthWallet extends BlockchainWallet {

    constructor(waas: Waas, walletInstance: Wallet) {
        super(waas, walletInstance);
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
     * Sends Ether to address from given wallet
     * @param recipient - {@link IEthereumRecipient}
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum/make-wallet-transaction}
     */
    public async send(recipient: IEthereumRecipient): Promise<ITransaction> {
        this.validateRecipient(recipient);
        return this.waas.wrap<ITransaction>(() => this.waas.instance
            .post(`eth/wallet/${this.wallet}/send`, {
                ...recipient,
            }),
        );
    }

    /**
     * Sends Ether to address from given wallet *asynchronously*
     * @param recipient - {@link IEthereumRecipient}
     * @see {@link https://docs.tangany.com/?version=latest#29e9ed85-f4a1-42bc-88fa-8e1f96fb426f}
     */
    public async sendAsync(recipient: IEthereumRecipient): Promise<Request> {
        this.validateRecipient(recipient);
        const rawResponse = await this.waas.wrap<{ statusUri: string }>(() => this.waas.instance
            .post(`eth/wallet/${this.wallet}/send-async`, {
                ...recipient,
            }),
        );
        const id = this.extractRequestId(rawResponse);
        return new Request(this.waas, id);
    }

    /**
     * Creates an RLP encoded transaction that is already signed and can be manually transmitted
     * to compatible blockchain networks at a later stage.
     * @param recipient - {@link IEthereumRecipient}
     */
    public async sign(recipient: IEthereumRecipient): Promise<ITransmittableTransaction> {
        this.validateRecipient(recipient);
        return this.waas.wrap<ITransmittableTransaction>(() => this.waas.instance
            .post(`eth/wallet/${this.wallet}/sign`, {
                ...recipient,
            }),
        );
    }

    /**
     * Returns wallet calls for the Ethereum ERC20 token
     * @param tokenAddress - Ethereum ERC20 token address for given eth network
     */
    public erc20(tokenAddress: string): EthErc20Wallet {
        return new EthErc20Wallet(this.waas, this.walletInstance, tokenAddress);
    }

    /**
     * Returns wallet calls for universal Smart Contract method calling
     */
    public contract(address: string): EthContractWallet {
        return new EthContractWallet(this.waas, this.walletInstance, address);
    }

    /**
     * @deprecated Do not use this outside unit testing
     */
    // tslint:disable-next-line:variable-name
    public __test_validateRecipient = (...args: any) => this.validateRecipient.apply(this, args);

    /**
     * Throws an exception if the passed recipient is invalid or otherwise ends successfully without a return value.
     * @param recipient - Recipient to be validated ({@link IEthereumRecipient})
     */
    private validateRecipient(recipient: IEthereumRecipient,): void {
        if (!recipient.to) {
            throw new Error("Missing 'to' argument");
        }
        if (!recipient.amount) {
            throw new Error("Missing 'amount' argument");
        }
        t(ethereumRecipientType, recipient, true);
    }
}
