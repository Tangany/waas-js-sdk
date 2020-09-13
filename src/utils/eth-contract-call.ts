import {IContractCall, IContractCallResponse} from "../interfaces";
import {Waas} from "../waas";

/**
 * Returns a TypeScript function to call an Ethereum smart contract function.
 * This is is mainly a helper to handle the repetitive overloading variants
 * in {@link EthereumContract} and {@link EthContractWallet}.
 * @param waas - Current WaaS instance
 * @param contractAddress - Address of the contract whose function is to be executed
 * @param [walletName] - Name of the wallet on whose behalf the contract function is to be executed
 */
export function callContractFunction(waas: Waas, contractAddress: string, walletName?: string) {

    const baseUrl = `eth/contract/${contractAddress}${walletName ? "/" + walletName : ""}`;

    return async function(config: IContractCall | string, types?: string[]) {
        if (typeof config === "object" && config !== null) {
            if (types) {
                throw new Error("Using the second parameter is not allowed if an object is passed as first argument");
            }

            const response = await waas.wrap<IContractCallResponse>(() => waas.instance
                .post(`${baseUrl}/call`, {...config})
            );

            return response.list;
        } else if (typeof config === "string") {
            // See https://stackoverflow.com/questions/42898009/multiple-fields-with-same-key-in-query-params-axios-request
            const params = new URLSearchParams();
            if (types) {
                types.forEach(type => params.append("type", type));
            }

            const response = await waas.wrap<IContractCallResponse>(() => waas.instance
                .get(`${baseUrl}/call/${config}`, {params})
            );

            return response.list;
        } else {
            throw new Error("Passed arguments do not match any method signature");
        }
    }

}
