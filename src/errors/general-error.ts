import {IHttpError} from "./ihttp-error";

export class GeneralError implements IHttpError {
    public readonly status: number;
    public readonly message: string;
    public readonly name: string;

    constructor(status = 400, msg: string) {
        Object.setPrototypeOf(this, GeneralError.prototype); // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        this.message = msg;
        this.status = status;
        this.name = "Error";
    }
}
