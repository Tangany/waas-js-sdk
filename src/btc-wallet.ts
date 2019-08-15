import {WaasAxiosInstance, recipientType} from "./waas-axios-instance";
import {AxiosInstance} from "axios";
import {IBitcoinTransactionEstimation, IRecipient, ITransaction, IWalletBalance} from "./interfaces";
import {Wallet} from "./wallet";
import * as t from "typeforce";

/**
 * Represents a new Bitcoin wallet interface
 * @param instance - axios instance created by {@link Waas}
 * @param walletInstance - instance of Wallet class
 */
export class BtcWallet extends WaasAxiosInstance {
    constructor(instance: AxiosInstance, private readonly walletInstance: Wallet) {
        super(instance);
    }

    public get wallet() {
        t("String", this.walletInstance.wallet);

        return this.walletInstance.wallet;
    }

    /**
     * Returns wallet metrics for the Bitcoin blockchain (BTC balance, wallet address)
     * @see {@link https://tangany.docs.stoplight.io/api/bitcoin/get-btc-balance}
     */
    public async get(): Promise<IWalletBalance> {
        return this.instance.get(`btc/wallet/${this.wallet}`);
    }

    /**
     * Send BTC to address from current wallet
     * @param recipients - Recipient configuration
     * @see {@link https://tangany.docs.stoplight.io/api/bitcoin/make-btc-transaction}
     */
    public async send(recipients: IRecipient[] | IRecipient): Promise<ITransaction> {
        return this.instance.post(`btc/wallet/${this.wallet}/send`, this.getRecipientsData(recipients));
    }

    /**
     * Estimate sending fee in BTC for given recipients
     * @param recipientsObject - a recipients configuration object
     * @see {@link https://tangany.docs.stoplight.io/api/bitcoin/estimate-btc-transaction}
     */
    public async estimateFee(recipientsObject: IRecipient[] | IRecipient): Promise<IBitcoinTransactionEstimation> {
        return this.instance
            .post(`btc/wallet/${this.wallet}/estimate-fee`, this.getRecipientsData(recipientsObject))
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
