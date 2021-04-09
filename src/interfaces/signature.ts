import {SignatureEncoding} from "../types/common";

export interface ISignatureResponse {
    signature: string;
    encoding: SignatureEncoding;
}

export interface ISignatureVerificationResponse {
    isValid: boolean;
}

/**
 * Represents an RLP encoded transaction that is already signed
 */
export interface ITransmittableTransaction {
    rawTransaction: string;
}
