import {WaasAxiosInstance} from "./waas-axios-instance";
import {AxiosInstance, AxiosResponse} from "axios";
import {IEthereumTransactionStatus} from "./interfaces";
import {TimeoutError} from "./errors";

/**
 *  instantiates a new Ethereum interface
 * @param instance - axios instance created by {@link WaasApi}
 * @param [txHash] - Ethereum transaction hash
 */
export class Ethereum extends WaasAxiosInstance {
    private readonly txHash?: string;

    constructor(instance: AxiosInstance, txHash?: string) {
        super(instance);
        this.txHash = txHash;
    }

    /**
     * Returns the status for an Ethereum transaction. The transaction is not mined until a blockNr is assigned.
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum/get-eth-tx-status}
     */
    public async get(): Promise<AxiosResponse<IEthereumTransactionStatus>> {
        if (!this.txHash) {
            throw new Error("missing argument txHash");
        }

        return this.instance.get(`eth/transaction/${this.txHash}`);
    }

    /**
     * helper: resolves when givenEthereum transaction is mined or errored
     * @param [timeout] - throw when not mined until timeout ms
     */
    public async wait(timeout = 20000): Promise<IEthereumTransactionStatus> {
        if (!this.txHash) {
            throw new Error("missing argument txHash");
        }

        return new Promise(async (resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new TimeoutError("timeout for retrieving mined status for transaction"));

                return;
            }, timeout);

            const checkMined = async (): Promise<void> => {
                const {isError, blockNr} = (await this.get()).data;
                if (isError || typeof blockNr === "number") {
                    clearTimeout(timer);
                    resolve({isError, blockNr});
                } else {
                    setTimeout(checkMined, 100);
                }

                return;
            };

            try {
                return checkMined();
            } catch (e) {
                clearTimeout(timer);
                throw e;
            }
        });
    }
}
