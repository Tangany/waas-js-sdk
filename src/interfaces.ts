import {AxiosResponse} from "axios";
import {WalletSecurity, WalletVersion} from "./waas";

/**
 * Represents the response of a ERC20 token wallet balance
 */
export interface ITokenBalance extends AxiosResponse {
    data: {
        balance: string;
        currency: string;
    };
}

/**
 * Represents a wallet list operation response
 */
export interface ITransaction extends AxiosResponse {
    data: {
        hash: string;
    };
}

/**
 * Represents a wallet response
 */
export interface IWallet extends AxiosResponse {
    data: {
        wallet: string;
        security: WalletSecurity;
        updated: string;
        created: string;
        version: string | WalletVersion.LATEST;
    };

}

/**
 * Represents a wallet list operation response
 */
export interface IWalletList extends AxiosResponse {
    data: {
        list: IWallet[];
        skiptoken: string;
    };
}

/**
 * Represents the response of a soft-deleted wallet
 */
export interface ISoftDeletedWallet extends AxiosResponse {
    data: {
        recoveryId: string;
        scheduledPurgeDate: string;
    };
}

/**
 * Represents the response of a Blockchain wallet balance
 */
export interface IWalletBalance extends AxiosResponse {
    data: {
        address: string;
        balance: string;
        currency: string;
    };
}

export type IBlockchainTransactionStatus = IEthereumTransactionStatus | IBitcoinTransactionStatus;

/**
 * Represents the transaction status response for the Ethereum network
 */
export interface IEthereumTransactionStatus extends AxiosResponse {
    data: {
        isError: boolean;
        blockNr: number | null;
        data: string | null;
    };
}

/**
 * Represents the transaction status response for the Bitcoin network
 */
export interface IBitcoinTransactionStatus extends AxiosResponse {
    data: {
        status: "pending" | "confirmed" | "error";
        confirmations: number;
    };
}

/**
 * Represents a Bitcoin transaction estimation
 */
export interface IBitcoinTransactionEstimation extends AxiosResponse {
    data: {
        fee: string;
        feeRate: number;
    };
}

/**
 * Represents a transaction recipient configuration
 * @param to - Recipient address
 * @param amount - Float currency amount formatted as a string
 */
export interface IRecipient {
    to: string;
    amount: string;
}

/**
 * Represents a transaction recipient configuration
 * @param to - Recipient ethereum address
 * @param amount - Float Ether amount formatted as a string
 * @param [data] - Ethereum transaction data payload
 */
export interface IEthereumRecipient extends IRecipient {
    data?: string;
}

export interface IWaasError {
    statusCode: number;
    activityId: string;
    message: string;
}
