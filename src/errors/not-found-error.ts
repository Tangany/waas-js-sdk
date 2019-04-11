export class NotFoundError extends Error {
    public readonly status = 404;

    constructor(msg = "Resource not found for current user") {
        super();
        Object.setPrototypeOf(this, NotFoundError.prototype); // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        this.message = msg;
    }
}
