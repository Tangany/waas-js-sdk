import {BlockchainWallet} from "./blockchain-wallet";
import {IAsyncBitcoinTransactionOutput, IBitcoinSweepResult, IBitcoinTransactionEstimation} from "./interfaces/bitcoin";
import {IAsyncEndpointResponse, IRecipient, ITransactionSentResponse} from "./interfaces/common";
import {ITransmittableTransaction} from "./interfaces/signature";
import {IWalletBalance} from "./interfaces/wallet";
import {recipientType, Waas} from "./waas";
import {Request} from "./request";
import {Wallet} from "./wallet";
import * as t from "typeforce";

/**
 * Represents a new Bitcoin wallet interface
 * @param instance - axios instance created by {@link Waas}
 * @param walletInstance - instance of Wallet class
 */
export class BtcWallet extends BlockchainWallet {

    private readonly baseUrl: string;

    constructor(waas: Waas, walletInstance: Wallet) {
        super(waas, walletInstance);
        this.baseUrl = `btc/wallet/${this.wallet}`;
    }

    /**
     * Returns wallet metrics for the Bitcoin blockchain (BTC balance, wallet address)
     * @see [docs]{@link https://docs.tangany.com/#ccedf387-e9f9-4118-985c-d434e762b6fe}
     */
    public async get(): Promise<IWalletBalance> {
        return this.waas.wrap<IWalletBalance>(() => this.waas.instance.get(this.baseUrl));
    }

    /**
     * Send BTC to address from current wallet
     * @param recipients - Recipient configuration
     * @see [docs]{@link https://docs.tangany.com/#62b0f6e4-641b-4230-8cf2-1cb8b2181812}
     */
    public async send(recipients: IRecipient[] | IRecipient): Promise<ITransactionSentResponse> {
        return this.waas.wrap<ITransactionSentResponse>(() => this.waas.instance.post(`${this.baseUrl}/send`, this.getRecipientsData(recipients)));
    }

    /**
     * Send BTC from the current wallet to the given recipients in an *asynchronous* manner.
     * @param recipients - Recipient configuration
     */
    public async sendAsync(recipients: IRecipient[] | IRecipient): Promise<Request<IAsyncBitcoinTransactionOutput>> {
        const rawResponse = await this.waas.wrap<IAsyncEndpointResponse>(() => this.waas.instance
            .post(`${this.baseUrl}/send-async`, this.getRecipientsData(recipients)),
        );
        const id = this.extractRequestId(rawResponse);
        return new Request<IAsyncBitcoinTransactionOutput>(this.waas, id);
    }

    /**
     * Creates an RLP encoded transaction that is already signed and can be manually transmitted
     * to compatible blockchain networks at a later stage.
     * @param recipients - Recipient configuration
     * @see [docs]{@link https://docs.tangany.com/#53017845-c0e8-4100-bb24-6168b00bd225}
     */
    public async sign(recipients: IRecipient[] | IRecipient): Promise<ITransmittableTransaction> {
        return this.waas.wrap<ITransmittableTransaction>(() => this.waas.instance
            .post(`${this.baseUrl}/sign`, this.getRecipientsData(recipients)));
    }

    /**
     * Estimate sending fee in BTC for given recipients
     * @param recipientsObject - a recipients configuration object
     * @see [docs]{@link https://docs.tangany.com/#7272d8f1-38d5-4ee7-9c69-2154405bb83b}
     */
    public async estimateFee(recipientsObject: IRecipient[] | IRecipient): Promise<IBitcoinTransactionEstimation> {
        return this.waas.wrap<IBitcoinTransactionEstimation>(() => this.waas.instance
            .post(`${this.baseUrl}/estimate-fee`, this.getRecipientsData(recipientsObject)))
            ;
    }

    /**
     * Transfers all available funds minus the transaction fees to the specified wallet or address.
     * One of the two properties from the parameter object must be set.
     * If both are set, the specified address needs to belong to the wallet.
     * @param to - Definition of the target using a Bitcoin address
     * @param wallet - Definition of the target using a wallet name of the current key vault
     */
    public async sweepAsync({to, wallet}: { to?: string, wallet?: string }): Promise<Request<IBitcoinSweepResult>> {
        const rawResponse = await this.waas.wrap<IAsyncEndpointResponse>(() => this.waas.instance
            .post(`${this.baseUrl}/sweep-async`, {to, wallet}),
        );
        const id = this.extractRequestId(rawResponse);
        return new Request<IBitcoinSweepResult>(this.waas, id);
    }

    /**
     * @deprecated do not use outside of unit tests
     */
    // tslint:disable-next-line:variable-name
    public __test_getRecipientsData = (...args: any) => this.getRecipientsData.apply(this, args);

    /**
     * convert recipients sdk argument to api data object
     */
    private readonly getRecipientsData = (recipients: IRecipient[] | IRecipient): IRecipient | { list: IRecipient[] } => {
        let data: any = {};

        const checkType = (recipient: IRecipient) => {
            const {to, wallet, amount} = recipient;
            if (!(to || wallet)) {
                throw new Error("At least one of the properties 'to' or 'wallet' must be set");
            }
            if (!amount) {
                throw new Error("Missing 'amount' argument");
            }

            t(recipientType, {to, wallet, amount}, true);

            return recipient;
        };

        if (recipients instanceof Array) {
            data.list = recipients.map(checkType);
        } else {
            checkType(recipients);
            data = {...recipients};
        }

        return data;
    }

}
