import {HttpError} from "./http-error";

// The activityId argument is optional, since there is none if an AuthenticationError is thrown on the client side.
// This is the case, for example, if the credentials are missing when the WaaS object is instantiated.
export class AuthenticationError extends HttpError {
    constructor(msg = "Invalid authentication", activityId?: string) {
        super(msg, 401, activityId);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}
