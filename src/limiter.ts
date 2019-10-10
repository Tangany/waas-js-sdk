import Bottleneck from "bottleneck";

const limiter = new Bottleneck({
    reservoir: 100, // 100 requests...
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 10 * 1e3, // ...per 10s
    maxConcurrent: 5, // max. 5 simultaneous requests
    minTime: 10, // delay each request bx 10ms
});

// tslint:disable-next-line:ban-types
export function LimiterEnabled(constructorFunction: Function) {
    constructorFunction.prototype.limiter = limiter;
}
