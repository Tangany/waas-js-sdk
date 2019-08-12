import {AxiosInstance} from "axios";
import {MiningError, TimeoutError} from "./errors";
import {IBlockchainTransactionStatus} from "./interfaces";
import Timeout = NodeJS.Timeout;

export interface IWaitForTxStatus {
    status: "confirmed" | "pending" | "error";
    response: IBlockchainTransactionStatus;
}

export abstract class WaasAxiosInstance {
    protected readonly instance: AxiosInstance;

    protected constructor(instance: AxiosInstance) {
        this.instance = instance;
    }

    // tslint:disable-next-line:variable-name
    public __test_getRecipientsData = (...args: any) => this.waitForTxStatus.apply(this, args);

    /**
     *  Will execute the statusGetterCall periodically for timeout ms and resolve the status
     * @param statusGetterCall - function to fetch the transaction status from a blockchain
     * @param [hash} - transaction hash
     * @param [timeout] - if the statusGetterCall did not resolved during the timeout period (in ms) the function will reject
     */
    protected waitForTxStatus = async (statusGetterCall: Promise<IWaitForTxStatus>, hash?: string, timeout = 20000): Promise<IBlockchainTransactionStatus> =>
        new Promise(async (resolve, reject) => {
            let subtimer: Timeout;

            // reject function when the global timer completes;
            const timer = global.setTimeout(() => { // https://github.com/Microsoft/TypeScript/issues/30128
                clearTimeout(subtimer);
                reject(new TimeoutError(`Timeout for retrieving transaction status for ${hash || "transaction"}`));

                return;
            }, timeout);

            const checkMined = async (): Promise<void> => {
                const {status, response} = await statusGetterCall;
                switch (status) {
                    case "confirmed":
                        clearTimeout(timer);
                        resolve(response);

                        return;
                    case "error":
                        clearTimeout(timer);
                        reject(new MiningError(response));

                        return;
                    case "pending":
                    default:
                        subtimer = global.setTimeout(checkMined, 100);

                }
            };

            checkMined()
                .catch(e => {
                    clearTimeout(timer);
                    reject(e);
                });

        })

}
