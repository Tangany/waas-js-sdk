import {IHttpError} from ".";

export class ConflictError implements IHttpError {
    public readonly status = 409;
    public readonly message: string;
    public readonly name: string;

    constructor(msg = "Cannot reset resource") {
        Object.setPrototypeOf(this, ConflictError.prototype);
        this.message = msg;
        this.name = "ConflictError";
    }
}
