import {IBitcoinTransaction} from "../interfaces/bitcoin";
import {IAsyncRequestStatus, IWaasError} from "../interfaces/common";
import {IEthereumTransaction} from "../interfaces/ethereum";
import {IContractCallResponse} from "../interfaces/ethereum-contract";

/**
 * General purpose utility type to specify only some properties of T as optional (in contrast to Partial<T>)
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;

/**
 * Constructs a type where all properties of the passed `T` are optional, but at least one of them must be set.
 * In contrast to `Partial<T>` the value `{}` is not allowed.
 * The generic type `U` must not be set, because it is only an auxiliary construction.
 * @see https://stackoverflow.com/a/48244432
 */
export type AtLeastOne<T, U = { [K in keyof Required<T>]: Pick<Required<T>, K> }> = Partial<T> & U[keyof U];

export type TransactionStatus = "unknown" | "pending" | "confirmed" | "error";

export type NodeStatus = "live" | "unavailable" | "faulty";

export type SignatureEncoding = "der" | "ieee-p1363";

export type Transaction = IEthereumTransaction | IBitcoinTransaction;

export type WaasErrorResponse = IWaasError | IAsyncRequestStatus<IWaasError>;

export type ContractCallResult = IContractCallResponse["list"];
