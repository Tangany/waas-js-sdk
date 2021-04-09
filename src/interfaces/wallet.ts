import {WalletSecurity, WalletVersion} from "../waas";

/**
 * Represents a wallet response
 */
export interface IWallet {
    wallet: string;
    security: WalletSecurity;
    updated: string;
    created: string;
    version: string | WalletVersion.LATEST;
    public: {
        secp256k1: string
    };
    tags: string[];
}

/**
 * Represents a wallet list operation response
 */
export interface IWalletList {
    hits: {
        total: number;
        hsm: number
    };
    list: IWallet[];
    skiptoken: string;
}

/**
 * Represents the response of a soft-deleted wallet
 */
export interface ISoftDeletedWallet {
    recoveryId: string;
    scheduledPurgeDate: string;
}

/**
 * Represents the response of a Blockchain wallet balance
 */
export interface IWalletBalance {
    address: string;
    balance: string;
    currency: string;
}
