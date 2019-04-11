export class TimeoutError extends Error {
    public readonly status = 408;

    constructor(msg = "Request Timeout") {
        super();
        Object.setPrototypeOf(this, TimeoutError.prototype); // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        this.message = msg;
    }
}
