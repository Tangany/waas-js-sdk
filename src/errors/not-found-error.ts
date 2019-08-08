import {IHttpError} from ".";

export class NotFoundError implements IHttpError {
    public readonly status = 404;
    public readonly message: string;
    public readonly name: string;

    constructor(msg = "Requested resource not found") {
        Object.setPrototypeOf(this, NotFoundError.prototype);
        this.message = msg;
        this.name = "NotFoundError";
    }
}
