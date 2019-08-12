import {HttpError} from "./http-error";

export class TimeoutError extends HttpError {
    constructor(msg = "Request Timeout") {
        super(msg, 408);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, TimeoutError.prototype);
    }
}
