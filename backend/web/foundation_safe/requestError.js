/**
 * Denotes an error that is with the request not the server
 */
export class RequestError extends Error {
    constructor(message, effect = "none") {
        super(message);
        this.effect = effect;
    }
}

export class RequestNeedsNewLoginError extends RequestError {
    constructor(message) {
        super(message, "needs_new_login");
    }
}