import {
    BitcoinNetwork,
    BlockchainTxConfirmations,
    BitcoinTxSpeed,
    EthereumPublicNetwork,
    EthereumTxSpeed,
    ApiVersion,
} from "./waas";
import * as Errors from "./errors";

export {Waas} from "./waas";
export const errors = Errors;
export const ETHEREUM_TX_CONFIRMATIONS = BlockchainTxConfirmations;
export const ETHEREUM_TX_SPEED = EthereumTxSpeed;
export const ETHEREUM_PUBLIC_NETWORK = EthereumPublicNetwork;
export const BITCOIN_NETWORK = BitcoinNetwork;
export const BITCOIN_TX_CONFIRMATIONS = BlockchainTxConfirmations;
export const BITCOIN_TX_SPEED = BitcoinTxSpeed;
export const API_VERSION = ApiVersion;
