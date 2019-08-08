import {IHttpError} from ".";

export class TimeoutError implements IHttpError {
    public readonly status = 408;
    public readonly message: string;
    public readonly name: string;

    constructor(msg = "Request Timeout") {
        Object.setPrototypeOf(this, TimeoutError.prototype);
        this.message = msg;
        this.name = "TimeoutError";
    }
}
