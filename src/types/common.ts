import {IBitcoinTransaction} from "../interfaces/bitcoin";
import {IAsyncRequestStatus, IWaasError} from "../interfaces/common";
import {IEthereumTransaction} from "../interfaces/ethereum";
import {IContractCallResponse} from "../interfaces/ethereum-contract";

/**
 * General purpose utility type to specify only some properties of T as optional (in contrast to Partial<T>)
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export type TransactionStatus = "unknown" | "pending" | "confirmed" | "error";

export type NodeStatus = "live" | "unavailable" | "faulty";

export type SignatureEncoding = "der" | "ieee-p1363";

export type Transaction = IEthereumTransaction | IBitcoinTransaction;

export type WaasErrorResponse = IWaasError | IAsyncRequestStatus<IWaasError>;

export type ContractCallResult = IContractCallResponse["list"];
