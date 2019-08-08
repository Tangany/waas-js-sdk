import {IHttpError} from ".";

export class GeneralError implements IHttpError {
    public readonly message: string;
    public readonly name: string;

    constructor(msg: string, public readonly status = 400) {
        Object.setPrototypeOf(this, GeneralError.prototype);
        this.message = msg;
        this.name = "Error";
    }
}
