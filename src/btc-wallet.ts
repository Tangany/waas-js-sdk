import {BlockchainWallet} from "./blockchain-wallet"
import {recipientType, Waas} from "./waas";
import {IBitcoinTransactionEstimation, ITransmittableTransaction, IRecipient, ITransaction, IWalletBalance} from "./interfaces";
import {Wallet} from "./wallet";
import * as t from "typeforce";

/**
 * Represents a new Bitcoin wallet interface
 * @param instance - axios instance created by {@link Waas}
 * @param walletInstance - instance of Wallet class
 */
export class BtcWallet extends BlockchainWallet {
    constructor(waas: Waas, walletInstance: Wallet) {
        super(waas, walletInstance);
    }

    /**
     * Returns wallet metrics for the Bitcoin blockchain (BTC balance, wallet address)
     * @see [docs]{@link https://docs.tangany.com/?version=latest#ccedf387-e9f9-4118-985c-d434e762b6fe}
     */
    public async get(): Promise<IWalletBalance> {
        return this.waas.wrap<IWalletBalance>(() => this.waas.instance.get(`btc/wallet/${this.wallet}`));
    }

    /**
     * Send BTC to address from current wallet
     * @param recipients - Recipient configuration
     * @see [docs]{@link https://docs.tangany.com/?version=latest#62b0f6e4-641b-4230-8cf2-1cb8b2181812}
     */
    public async send(recipients: IRecipient[] | IRecipient): Promise<ITransaction> {
        return this.waas.wrap<ITransaction>(() => this.waas.instance.post(`btc/wallet/${this.wallet}/send`, this.getRecipientsData(recipients)));
    }

    /**
     * Creates an RLP encoded transaction that is already signed and can be manually transmitted
     * to compatible blockchain networks at a later stage.
     * @param recipients - Recipient configuration
     * @see [docs]{@link https://docs.tangany.com/?version=latest#53017845-c0e8-4100-bb24-6168b00bd225}
     */
    public async sign(recipients: IRecipient[] | IRecipient): Promise<ITransmittableTransaction> {
        return this.waas.wrap<ITransmittableTransaction>(() => this.waas.instance
            .post(`btc/wallet/${this.wallet}/sign`, this.getRecipientsData(recipients)));
    }

    /**
     * Estimate sending fee in BTC for given recipients
     * @param recipientsObject - a recipients configuration object
     * @see [docs]{@link https://docs.tangany.com/?version=latest#7272d8f1-38d5-4ee7-9c69-2154405bb83b}
     */
    public async estimateFee(recipientsObject: IRecipient[] | IRecipient): Promise<IBitcoinTransactionEstimation> {
        return this.waas.wrap<IBitcoinTransactionEstimation>(() => this.waas.instance
            .post(`btc/wallet/${this.wallet}/estimate-fee`, this.getRecipientsData(recipientsObject)))
            ;
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
            if (!recipient.to) {
                throw new Error("Missing 'to' argument");
            }
            if (!recipient.amount) {
                throw new Error("Missing 'amount' argument");
            }

            t(recipientType, {to: recipient.to, amount: recipient.amount}, true);

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
