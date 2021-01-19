import {HttpError} from "./http-error";

export class ConflictError extends HttpError {
    constructor(msg = "Cannot reset resource", activityId: string) {
        super(msg, 409, activityId);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
