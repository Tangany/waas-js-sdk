import {WaasAxiosInstance} from "./waas-axios-instance";
import {AxiosInstance, AxiosResponse} from "axios";
import {ITransaction, IWalletBalance} from "./interfaces";
import {Wallet} from "./wallet";

/**
 * A Bitcoin transaction recipient configuration
 * @param to - Bitcoin recipient address
 * @param amount - Bitcoin recipient address
 */
interface IBtcRecipient {
    to: string;
    amount: string;
}

/**
 *  instantiates a new Bitcoin wallet interface
 * @param instance - axios instance created by {@link WaasApi}
 * @param walletInstance - instance of Wallet class
 */
export class BtcWallet extends WaasAxiosInstance {
    private readonly walletInstance: Wallet;

    constructor(instance: AxiosInstance, walletInstance: Wallet) {
        super(instance);
        this.walletInstance = walletInstance;
    }

    /**
     * Returns wallet metrics for the Bitcoin blockchain (BTC balance, wallet address)
     * @see {@link https://tangany.docs.stoplight.io/api/bitcoin/get-btc-balance}
     */
    public async get(): Promise<AxiosResponse<IWalletBalance>> {
        if (!this.walletInstance.wallet) {
            throw new Error("missing wallet variable in Wallet instance");
        }

        return this.instance
            .get(`btc/wallet/${this.walletInstance.wallet}`)
            .catch(this.catch404.bind(this))
            ;
    }

    /**
     * Send BTC to address from current wallet
     * @see {@link https://tangany.docs.stoplight.io/api/bitcoin/make-btc-transaction}
     */
    public async send(recipients: IBtcRecipient[] | IBtcRecipient): Promise<AxiosResponse<ITransaction>> {
        if (!this.walletInstance.wallet) {
            throw new Error("missing wallet variable in Wallet instance");
        }

        const data = this.getRecipientsData(recipients);

        return this.instance
            .post(`btc/wallet/${this.walletInstance.wallet}/send`, data)
            .catch(this.catch404.bind(this))
            ;
    }

    /**
     * Estimate sending fee in BTC for given recipients
     * @see {@link https://tangany.docs.stoplight.io/api/bitcoin/estimate-btc-transaction}
     */
    public async estimateFee(recipients: IBtcRecipient[] | IBtcRecipient): Promise<AxiosResponse<ITransaction>> {
        if (!this.walletInstance.wallet) {
            throw new Error("missing wallet variable in Wallet instance");
        }

        const data = this.getRecipientsData(recipients);

        return this.instance
            .post(`eth/wallet/${this.walletInstance.wallet}/estimate-fee`, data)
            .catch(this.catch404.bind(this))
            ;
    }

    /**
     * convert recipients sdk argument to api data object
     */
    private readonly getRecipientsData = (recipients: IBtcRecipient[] | IBtcRecipient): IBtcRecipient | { list: IBtcRecipient[] } => {
        const data: any = {};

        if (recipients instanceof Array) {
            recipients.map(r => {
                if (!r.to) {
                    throw new Error("missing to arg in recipient object");
                }
                if (!r.amount) {
                    throw new Error("missing amount arg in recipient object");
                }
            });

            data.list = recipients;

        } else {
            if (!recipients.to) {
                throw new Error("missing to arg in recipient object");
            }
            if (!recipients.amount) {
                throw new Error("missing amount arg in recipient object");
            }
            data.to = recipients.to;
            data.amount = recipients.amount;
        }

        return data;
    }

}
