import { RequestHandler } from "express";

const apiDecorator = (method: string, ...handlers: RequestHandler[]) => {
    if (method[0] != "/") method = `/${method}`;

    return { method, handlers }
}

export default apiDecorator;