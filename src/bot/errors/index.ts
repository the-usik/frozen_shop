export class ApiError extends Error {
    public constructor(code, message) {
        super(message);
        this.message = `Code #${code} -> ${message}`;
        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
    }
}