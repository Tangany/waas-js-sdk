import * as t from "typeforce";
import {BlockchainWallet} from "./blockchain-wallet";
import {
    ContractCallResult, IAsyncEndpointResponse,
    IAsyncEthereumTransactionOutput,
    IContractCall,
    IContractTransaction,
    IEthereumTransactionEstimation
} from "./interfaces";
import {Request} from "./request";
import {callContractFunction} from "./utils/eth-contract-call"
import {Waas} from "./waas";
import {Wallet} from "./wallet"

/**
 * Instantiates a new interface to interact with universal Ethereum Smart Contracts
 * @param waas - {@link Waas} instance
 * @param id - Asynchronous request id
 */
export class EthContractWallet extends BlockchainWallet {

    private readonly baseUrl: string;

    constructor(waas: Waas, walletInstance: Wallet, public readonly address: string) {
        super(waas, walletInstance);
        t("String", address);
        this.baseUrl = `eth/contract/${address}/${this.wallet}`;
    }

    /**
     * Executes known functions of arbitrary Ethereum smart contracts
     * @param config - Smart Contract function configuration
     * @see [docs]{@link https://docs.tangany.com/#945c237f-5273-4e85-bf9d-1ba2b132df17}
     */
    public async sendAsync(config: IContractTransaction): Promise<Request<IAsyncEthereumTransactionOutput>> {
        const rawResponse = await this.waas.wrap<IAsyncEndpointResponse>(() => this.waas.instance
            .post(`${this.baseUrl}/send-async`, {
                ...config,
            }),
        );
        const id = this.extractRequestId(rawResponse);
        return new Request<IAsyncEthereumTransactionOutput>(this.waas, id);
    }

    /**
     * Returns the fee estimation for a smart contract execution with the given parameters.
     * The fee estimation is based on the current ethereum network utilization and can fluctuate in random fashion.
     * Thus the estimation cannot guarantee to match the actual transaction fee.
     * @param config - Smart contract function configuration
     */
    public async estimateFee(config: IContractTransaction): Promise<IEthereumTransactionEstimation> {
        return this.waas.wrap<IEthereumTransactionEstimation>(() => this.waas.instance
            .post(`${this.baseUrl}/estimate-fee`, config));
    }

    /**
     * Executes readonly functions of arbitrary Ethereum smart contracts.
     * If the contract function expects exactly one parameter of type address, the overload with
     * separate parameters can be used for convenience. This argument is then automatically filled with the
     * address of the current wallet. Furthermore, the solidity variable `msg.sender` is set to this address.
     * In this case, the default value for the output types is `["uint256"]`.
     * If the function expects several parameters, the overload with the configuration object must be used.
     * In this case, the first argument is not automatically filled with the wallet address.
     */
    public async call(config: IContractCall): Promise<ContractCallResult>;
    public async call(functionName: string, types?: string[]): Promise<ContractCallResult>;
    public async call(config: IContractCall | string, types?: string[]): Promise<ContractCallResult> {
        return callContractFunction(this.waas, this.address, this.wallet)(config, types);
    }

}
