import * as t from "typeforce";
import {BlockchainWallet} from "./blockchain-wallet"
import {EthTransaction} from "./eth-transaction"
import {IRecipient} from "./interfaces/common";
import {IEthereumTransactionSentResponse, ITokenBalance} from "./interfaces/ethereum";
import {recipientType, Waas} from "./waas";
import {Wallet} from "./wallet";

enum METHOD {
    TRANSFER = "transfer",
    APPROVE = "approve",
    TRANSFER_FROM = "transferFrom",
    BURN = "burn",
    MINT = "mint",
}

/**
 * Instantiates a new Ethereum ERC20 wallet interface
 * @param instance - Axios instance created by {@link Waas}
 * @param walletInstance - Instance of Wallet class
 * @param address - ERC20 token contract address
 */
export class EthErc20Wallet extends BlockchainWallet {

    constructor(waas: Waas, walletInstance: Wallet, public readonly address: string) {
        super(waas, walletInstance);
        t("String", address);
    }

    /**
     * Retrieves the token balance for given wallet
     * @see [docs]{@link https://docs.tangany.com/#f3c0c795-3cc4-45f4-ac6b-ca03f23e568c}
     */
    public async get(): Promise<ITokenBalance> {
        return this.waas.wrap<ITokenBalance>(() => this.waas.instance.get(`eth/erc20/${this.address}/${this.wallet}`));
    }

    /**
     * Send ERC20 tokens from given wallet to an Ethereum address
     * @param recipient - {@link IRecipient}
     * @see [docs]{@link https://docs.tangany.com/#8113cb99-b664-49b4-be12-35654f2190ef}
     */
    public async send(recipient: IRecipient): Promise<EthTransaction> {
        const {hash} = await this.waas.wrap<IEthereumTransactionSentResponse>(() => this.waas.instance
            .post(`eth/erc20/${this.address}/${this.wallet}/send`, this.getRecipientsData(METHOD.TRANSFER)(recipient)));
        return new EthTransaction(this.waas, hash);
    }

    /**
     * Approve an Ethereum address to withdraw ERC20 tokens from the wallet via the {@link transferFrom} operation
     * @param to - Ethereum address to approve the withdrawal. Not to confuse with the token address
     * @param amount - Float amount of tokens formatted as a string
     * @see [docs]{@link https://docs.tangany.com/#7a676b3d-93c9-4bed-b8ea-94c938909c61}
     */
    public async approve({to, amount}: { to: string, amount: string }): Promise<EthTransaction> {
        const {hash} = await this.waas.wrap<IEthereumTransactionSentResponse>(() => this.waas.instance
            .post(`eth/erc20/${this.address}/${this.wallet}/approve`, this
                .getRecipientsData(METHOD.APPROVE)({to, amount}),
            ),
        );
        return new EthTransaction(this.waas, hash);
    }

    /**
     * Withdraw the pre-approved amount of ERC20 tokens or less from a Ethereum address. The operation will fail if the withdrawn amount was not authorized by the address via the {@link approve} operation.
     * @param from - Ethereum address to withdraw tokens from. Not to confuse with the token address
     * @param amount - Float amount of tokens to withdraw formatted as a string
     * @see [docs]{@link https://docs.tangany.com/#3e92b48b-4626-4323-853e-3743237fc1f0}
     */
    public async transferFrom({from, amount}: { from: string, amount: string }): Promise<EthTransaction> {
        const {hash} = await this.waas.wrap<IEthereumTransactionSentResponse>(() => this.waas.instance
            .post(`eth/erc20/${this.address}/${this.wallet}/transfer-from`, this
                .getRecipientsData(METHOD.TRANSFER_FROM)({from, amount}),
            ),
        );
        return new EthTransaction(this.waas, hash);
    }

    /**
     * Executes the ERC20 method “burn” on compatible contracts to destroy an amount of tokens from the current wallet
     * @param amount - Float amount of tokens to burn from the wallet formatted as a string
     * @see [docs]{@link https://docs.tangany.com/#ab52e66d-dffa-4bf7-aa4a-62ab5093f219}
     */
    public async burn({amount}: { amount: string }): Promise<EthTransaction> {
        const {hash} = await this.waas.wrap<IEthereumTransactionSentResponse>(() => this.waas.instance
            .post(`eth/erc20/${this.address}/${this.wallet}/burn`, this
                .getRecipientsData(METHOD.BURN)({amount})),
        );
        return new EthTransaction(this.waas, hash);
    }

    /**
     * Executes the ERC20 method “mint” on compatible contracts to generate an amount of tokens to the current wallet. Fails if wallet is not a contract minter
     * @param amount - Float amount of tokens to mint to the wallet formatted as a string
     * @param [to] - Ethereum address to assign the mined tokens to. If omitted, tokens are assigned to the wallet address
     * @see [docs]{@link https://docs.tangany.com/#16d4bf9c-4bfb-4be5-bde4-cf4cdc938b29}
     */
    public async mint({amount, to}: { amount: string, to?: string }): Promise<EthTransaction> {
        const {hash} = await this.waas.wrap<IEthereumTransactionSentResponse>(() => this.waas.instance
            .post(`eth/erc20/${this.address}/${this.wallet}/mint`, this
                .getRecipientsData(METHOD.MINT)({amount, to})),
        );
        return new EthTransaction(this.waas, hash);
    }

    /**
     * @deprecated do not use outside of unit tests
     */
    // tslint:disable-next-line:variable-name
    public __test_getRecipientsData = (...args: any) => this.getRecipientsData.apply(this, args);

    /**
     * returns valid recipient object configuration for given ERC20 method
     */
    private readonly getRecipientsData = (method: METHOD) =>
        ({to, wallet, amount, from}: { to?: string, wallet?: string, amount: string, from?: string }) => {

        // In contrast to the non-ERC20 endpoints, the amount parameter is not optional here, but required
        switch (method) {
            case METHOD.MINT:
                if (!amount) {
                    throw new Error("Missing 'amount' argument");
                }
                if (from) {
                    throw new Error("Invalid 'from' argument");
                }
                t(recipientType, {to, wallet, amount}, true);

                return {to, wallet, amount};
            case METHOD.BURN:
                if (!amount) {
                    throw new Error("Missing 'amount' argument");
                }
                if (to) {
                    throw new Error("Invalid 'to' argument");
                }
                if (from) {
                    throw new Error("Invalid 'from' argument");
                }
                t({amount: "String"}, {amount}, true);

                return {amount};
            case METHOD.TRANSFER_FROM:
                if (!(from || wallet)) {
                    throw new Error("At least one of the properties 'from' or 'wallet' must be set");
                }
                if (to) {
                    throw new Error("Invalid 'to' argument");
                }
                if (!amount) {
                    throw new Error("Missing 'amount' argument");
                }
                t({from: "?String", wallet: "?String", amount: "String"}, {from, wallet, amount}, true);

                return {from, amount};
            case METHOD.APPROVE:
            case METHOD.TRANSFER:
            default:
                if (!(to || wallet)) {
                    throw new Error("At least one of the properties 'to' or 'wallet' must be set");
                }
                if (from) {
                    throw new Error("Invalid 'from' argument");
                }
                if (!amount) {
                    throw new Error("Missing 'amount' argument");
                }
                t(recipientType, {to, wallet, amount}, true);

                return {to, wallet, amount};
        }
    }
}
