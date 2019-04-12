import {IHttpError} from "./ihttp-error";

export class TimeoutError implements IHttpError {
    public readonly status = 408;
    public readonly message: string;
    public readonly name: string;

    constructor(msg = "Request Timeout") {
        Object.setPrototypeOf(this, TimeoutError.prototype); // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        this.message = msg;
        this.name = "TimeoutError";
    }
}
