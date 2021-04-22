import {EthTransactionAsync} from "./eth-transaction-async";
import {IAsyncRequestStatus} from "./interfaces/common";
import {IAsyncEthereumTransactionOutput} from "./interfaces/ethereum";
import {Request} from "./request";

/**
 * Provides the ability to query the status of asynchronously executed Ethereum transactions.
 */
export class EthTransactionRequest extends Request<EthTransactionAsync> {

    async get(): Promise<IAsyncRequestStatus<EthTransactionAsync>> {
        const response = await this.fetchStatus<IAsyncEthereumTransactionOutput>();
        const {output, ...originalResponseRest} = response;

        // If the property "output" is not yet filled (because the request is not yet finished), no conversion can take place.
        if (!output) {
            return {...originalResponseRest, output: null};
        }

        const {links, ...txDetails} = output;
        return {
            ...originalResponseRest,
            output: new EthTransactionAsync(this.waas, txDetails),
        };
    }
}
