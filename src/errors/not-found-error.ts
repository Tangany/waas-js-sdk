import {HttpError} from "./http-error";

export class NotFoundError extends HttpError {
    constructor(msg = "Requested resource not found") {
        super(msg, 404);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
