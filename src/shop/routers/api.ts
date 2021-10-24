import { isLocalRequest } from "@shop/utils/helpers";
import { error, ERROR_CODES } from "@shop/utils/response";
import locale from "@utils/locale";
import { Router } from "express";
import apiHandlers from "./api-handlers"

const api = Router();

const checkAuth = (request, response, next) => {
    if (!isLocalRequest(request) && !request.session.user)
        return response.send(error(ERROR_CODES.AUTH_FAILED, locale.get("auth_failed")));

    return next();
}

api.use(checkAuth);

for (let { method, handlers } of apiHandlers) {
    api.post(method, ...handlers);
}

api.use((_, response) => {
    return response.send(error(ERROR_CODES.NOT_FOUND, "Method not found"))
})

export default api;