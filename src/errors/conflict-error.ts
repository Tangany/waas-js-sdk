export class ConflictError extends Error {
    public readonly status = 409;

    constructor(msg = "Cannot reset resource") {
        super();
        Object.setPrototypeOf(this, ConflictError.prototype); // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        this.message = msg;
    }
}
