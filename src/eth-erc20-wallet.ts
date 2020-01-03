import * as t from "typeforce";
import {IRecipient, ITokenBalance, ITransaction} from "./interfaces";
import {recipientType, Waas} from "./waas";
import {IWaasMethod} from "./waas-method";
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
export class EthErc20Wallet implements IWaasMethod {

    get wallet() {
        t("String", this.walletInstance.wallet);

        return this.walletInstance.wallet;
    }

    constructor(public waas: Waas, public readonly walletInstance: Wallet, public readonly address: string) {
        t("String", address);
    }

    /**
     * Retrieves the token balance for given wallet
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum-erc20/get-token-balance}
     */
    public async get(): Promise<ITokenBalance> {
        return this.waas.wrap<ITokenBalance>(() => this.waas.instance.get(`eth/erc20/${this.address}/${this.wallet}`));
    }

    /**
     * Send ERC20 tokens from given wallet to an Ethereum address
     * @param recipient - {@link IRecipient}
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum-erc20/make-token-transaction}
     */
    public async send(recipient: IRecipient): Promise<ITransaction> {
        return this.waas.wrap<ITransaction>(() => this.waas.instance
            .post(`eth/erc20/${this.address}/${this.wallet}/send`, this
                .getRecipientsData(METHOD.TRANSFER)(recipient),
            ),
        );
    }

    /**
     * Approve an Ethereum address to withdraw ERC20 tokens from the wallet via the {@link transferFrom} operation
     * @param to - Ethereum address to approve the withdrawal. Not to confuse with the token address
     * @param amount - Float amount of tokens formatted as a string
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum-erc20/execute-eth-erc20-approve}
     */
    public async approve({to, amount}: { to: string, amount: string }): Promise<ITransaction> {
        return this.waas.wrap<ITransaction>(() => this.waas.instance
            .post(`eth/erc20/${this.address}/${this.wallet}/approve`, this
                .getRecipientsData(METHOD.APPROVE)({to, amount}),
            ),
        );
    }

    /**
     * Withdraw the pre-approved amount of ERC20 tokens or less from a Ethereum address. The operation will fail if the withdrawn amount was not authorized by the address via the {@link approve} operation.
     * @param from - Ethereum address to withdraw tokens from. Not to confuse with the token address
     * @param amount - Float amount of tokens to withdraw formatted as a string
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum-erc20/execute-eth-erc20-transfer-from}
     */
    public async transferFrom({from, amount}: { from: string, amount: string }): Promise<ITransaction> {
        return this.waas.wrap<ITransaction>(() => this.waas.instance
            .post(`eth/erc20/${this.address}/${this.wallet}/transfer-from`, this
                .getRecipientsData(METHOD.TRANSFER_FROM)({from, amount}),
            ),
        );
    }

    /**
     * Executes the ERC20 method “burn” on compatible contracts to destroy an amount of tokens from the current wallet
     * @param amount - Float amount of tokens to burn from the wallet formatted as a string
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum-erc20/execute-eth-erc20-burn}
     */
    public async burn({amount}: { amount: string }): Promise<ITransaction> {
        return this.waas.wrap<ITransaction>(() => this.waas.instance
            .post(`eth/erc20/${this.address}/${this.wallet}/burn`, this
                .getRecipientsData(METHOD.BURN)({amount})),
        );
    }

    /**
     * Executes the ERC20 method “mint” on compatible contracts to generate an amount of tokens to the current wallet. Fails if wallet is not a contract minter
     * @param amount - Float amount of tokens to mint to the wallet formatted as a string
     * @param [to] - Ethereum address to assign the mined tokens to. If omitted, tokens are assigned to the wallet address
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum-erc20/execute-eth-erc20-mint}
     */
    public async mint({amount, to}: { amount: string, to?: string }): Promise<ITransaction> {
        return this.waas.wrap<ITransaction>(() => this.waas.instance
            .post(`eth/erc20/${this.address}/${this.wallet}/mint`, this
                .getRecipientsData(METHOD.MINT)({amount, to})),
        );
    }

    /**
     * @deprecated do not use outside of unit tests
     */
        // tslint:disable-next-line:variable-name
    public __test_getRecipientsData = (...args: any) => this.getRecipientsData.apply(this, args);

    /**
     * returns valid recipient object configuration for given ERC20 method
     */
    private readonly getRecipientsData = (method: METHOD) => ({to, amount, from}: { to?: string, amount: string, from?: string }) => {

        switch (method) {
            case METHOD.MINT:
                if (!amount) {
                    throw new Error("Missing 'amount' argument");
                }
                if (from) {
                    throw new Error("Invalid 'from' argument");
                }
                t({to: "?String", amount: "String"}, {to, amount}, true);

                return {to, amount};
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
                if (!from) {
                    throw new Error("Missing 'from' argument");
                }
                if (to) {
                    throw new Error("Invalid 'to' argument");
                }
                if (!amount) {
                    throw new Error("Missing 'amount' argument");
                }
                t({from: "String", amount: "String"}, {from, amount}, true);

                return {from, amount};
            case METHOD.APPROVE:
            case METHOD.TRANSFER:
            default:
                if (!to) {
                    throw new Error("Missing 'to' argument");
                }
                if (from) {
                    throw new Error("Invalid 'from' argument");
                }
                if (!amount) {
                    throw new Error("Missing 'amount' argument");
                }
                t(recipientType, {to, amount}, true);

                return {to, amount};
        }
    }
}
