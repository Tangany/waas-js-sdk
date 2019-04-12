import {IHttpError} from "./ihttp-error";

export class AuthenticationError implements IHttpError {
    public readonly status = 401;
    public readonly message: string;
    public readonly name: string;

    constructor(msg = "Invalid authentication") {
        Object.setPrototypeOf(this, AuthenticationError.prototype); // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        this.message = msg;
        this.name = "AuthenticationError";
    }
}
