/**
 * Denotes an error that is with the request not the server, and should send a 400 response rather than 500.
 */
export class RequestError extends Error {
    constructor(message) {
        super(message);
    }
}
export class RequestNeedsNewLoginError extends RequestError {
    constructor(message = "Request needs new login") {
        super(message);
    }
}