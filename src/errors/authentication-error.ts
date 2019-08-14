import {HttpError} from "./http-error";

export class AuthenticationError extends HttpError {
    constructor(msg = "Invalid authentication") {
        super(msg, 401);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}
