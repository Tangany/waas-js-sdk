export class AuthenticationError extends Error {
    public readonly status = 401;

    constructor(msg = "Invalid authentication") {
        super();
        Object.setPrototypeOf(this, AuthenticationError.prototype); // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        this.message = msg;
    }
}
