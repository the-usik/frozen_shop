export interface OkResponse {
    success: number;
    payload: any;
}

export interface ErrorResponse {
    error: {
        code: number;
        message: any;
    }
}

export const ERROR_CODES = {
    INVALID_PARAMS: 1 << 0,
    AUTH_FAILED: 1 << 1,
    FAILED: 1 << 2,
    NOT_FOUND: 1 << 3
}

export const ok = (payload: any = {}): OkResponse => {
    return {
        success: 1,
        payload
    }
}

export const error = (code: number, message: string): ErrorResponse => {
    return {
        error: { code, message }
    }
}