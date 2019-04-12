import {IHttpError} from "./ihttp-error";

export class NotFoundError implements IHttpError {
    public readonly status = 404;
    public readonly message: string;
    public readonly name: string;

    constructor(msg = "Resource not found for current user") {
        Object.setPrototypeOf(this, NotFoundError.prototype); // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        this.message = msg;
        this.name = "NotFoundError";
    }
}
