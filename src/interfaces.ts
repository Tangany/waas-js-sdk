import {WalletSecurity, WalletVersion} from "./waas-api";

/**
 * represents the ERC20 token balance of a wallet
 */
export interface ITokenBalance {
    balance: string;
    currency: string;
}

/**
 * represents a wallet list operation
 */
export interface ITransaction {
    hash: string;
}

/**
 * represents a wallet
 */
export interface IWallet {
    wallet: string;
    security: WalletSecurity;
    updated: string;
    created: string;
    version: string | WalletVersion.LATEST;
}

/**
 * represents a wallet list operation
 */
export interface IWalletList {
    list: IWallet[];
    skiptoken: string;
}

/**
 * represents a soft-deleted wallet
 */
export interface ISoftDeletedWallet {
    recoveryId: string;
    scheduledPurgeDate: string;
}

/**
 * represents the Ethereum balance of a wallet
 */
export interface IEthWalletBalance {
    address: string;
    balance: string;
    currency: string;
}

/**
 * represents transaction status
 */
export interface ITransactionStatus {
    isError: boolean;
    blockNr: number | null;
}
