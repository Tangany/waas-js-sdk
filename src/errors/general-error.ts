import {HttpError} from "./http-error";

export class GeneralError extends HttpError {
    constructor(msg: string, public readonly status = 400, activityId: string) {
        super(msg, status, activityId);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, GeneralError.prototype);
    }
}
