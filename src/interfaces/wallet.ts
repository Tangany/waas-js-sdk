import {WalletSecurity, WalletVersion} from "../waas";
import {IHateoasLink, ISearchResponse} from "./common";

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

export interface IWalletSearchResponse extends ISearchResponse {
    hits: {
        total: number;
        hsm: number
    };
    list: {
        wallet: string;
        links: IHateoasLink<"wallet">[];
    }[];
}

/**
 * Parameters to configure pagination, sorting or filtering for wallet search requests.
 * There are API-side default values for index (0) and limit (10).
 * For all other parameters `undefined` or `[]` is used if no value is set explicitly.
 */
export interface IWalletSearchParams {
    index?: number;
    limit?: number;
    sort?:
        | "wallet"
        | "walletdesc"
        | "created"
        | "createddesc"
        | "updated"
        | "updateddesc"
        | "security"
        | "securitydesc";
    /** Include filter for tags (AND-linked) */
    tag?: string[];
    /** Exclude filter for tags (AND-linked) */
    xtag?: string[];
}
