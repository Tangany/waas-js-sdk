import {IHttpError} from "./ihttp-error";

export class ConflictError implements IHttpError {
    public readonly status = 409;
    public readonly message: string;
    public readonly name: string;

    constructor(msg = "Cannot reset resource") {
        Object.setPrototypeOf(this, ConflictError.prototype); // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        this.message = msg;
        this.name = "ConflictError";
    }
}
