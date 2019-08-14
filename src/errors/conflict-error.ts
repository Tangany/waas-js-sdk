import {HttpError} from "./http-error";

export class ConflictError extends HttpError {
    constructor(msg = "Cannot reset resource") {
        super(msg, 409);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
