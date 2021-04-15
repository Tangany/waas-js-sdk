import {IHateoasLink, ISearchResponse} from "./common";

interface IMonitorBase {
    target: "transaction";
    description: string;
    configuration: {
        direction?: "in" | "out";
        wallet?: string | string[];
        from?: string | string[];
        to?: string | string[];
        blockNr?: number;
        gas?: number;
        gasPrice?: string;
        gasUsed?: number;
        isError?: boolean;
        nonce?: number;
        timestamp?: number;
        value?: string;
    };
    webhook: { url: string; method?: "post" | "get" };
}

export interface IMonitor extends IMonitorBase {
    monitor: string;
    blockchain: "ethereum";
    network: "mainnet" | "ropsten";
    confirmations: number;
    status: "active" | "paused" | "deleted" | "halted";
    created: string;
    updated: string;
    invocations: {
        transmitted: number;
        failed: number;
    };
    lastInvocation: string;
}

export interface IMonitorCreationProperties extends IMonitorBase {
    status?: "active" | "paused";
}

export interface IMonitorSearchParams {
    index?: number;
    limit?: number;
    wallet?: string;
}

export interface IMonitorSearchResponse extends ISearchResponse {
    list: {
        monitor: string;
        description: string;
        links: IHateoasLink<"monitor">[];
    }[];
}
