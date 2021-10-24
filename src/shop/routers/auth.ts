import { User } from "@shop/database/models";
import { EMAIL_PATTERN } from "@shop/utils/constants";
import { calculateHash } from "@shop/utils/helpers";
import { error, ERROR_CODES, ok } from "@shop/utils/response";
import { Router } from "express";

const auth = Router();

const MIN_PASSWORD_LENGTH = 8;

auth.post("/login", async (request: any, response) => {
    if (request.session.user) {
        return response.send(error(ERROR_CODES.FAILED, "You're already authorized."));
    }

    let { body } = request;
    if (!body.login || !body.password) {
        return response.send(error(ERROR_CODES.INVALID_PARAMS, "Params login or password is missed."));
    }

    let { login, password } = body;
    let users = await User.find({
        login,
        password: calculateHash(password.trim())
    });

    if (users.length < 1) {
        return response.send(error(ERROR_CODES.INVALID_PARAMS, "The login or password is incorrect"));
    }

    let [user] = users as [any];

    request.session.user = user;
    request.session.save();

    return response.send(
        ok({ login: user.login, firstName: user.first_name, lastName: user.last_name })
    );
});

auth.post("/logout", async (request: any, response) => {
    try {
        if (!request.session.user) return response.send(error(ERROR_CODES.AUTH_FAILED, "You're already logout"));
        request.session.user = null;
        request.session.save();

        return response.send(ok());
    } catch (e: any) {
        return response.send(error(ERROR_CODES.FAILED, e.message))
    }
})

auth.post("/check", async (request: any, response) => {
    try {
        if (!request.session.user) {
            return response.send(error(ERROR_CODES.AUTH_FAILED, "Authorization failed"));
        }

        return response.send(ok(request.session.user));
    } catch (err: any) {
        response.send(error(ERROR_CODES.FAILED, err.message))
    }
})

auth.post("/signup", async (request: any, response) => {
    try {
        let { login, email, password, repeat_password } = request.body;

        login = login.trim();
        email = email.trim();
        password = password.trim();
        repeat_password = repeat_password.trim();

        if (password.length < MIN_PASSWORD_LENGTH) return response.send(error(ERROR_CODES.AUTH_FAILED, "Длина пароля должна быть не менее 8-ми символов"))

        if (!login || !email || !password || !repeat_password) {
            return response.send(error(ERROR_CODES.INVALID_PARAMS, "Invalid params."));
        }

        if (!EMAIL_PATTERN.test(email))
            return response.send(error(ERROR_CODES.INVALID_PARAMS, "Incorrect email address."));

        if (password != repeat_password) {
            return response.send(error(ERROR_CODES.INVALID_PARAMS, "Your password is different."));
        }

        let findedUserByLogin = await User.find({ login });
        if (findedUserByLogin.length > 0) {
            return response.send(error(ERROR_CODES.FAILED, "The user with specify login already exists!"));
        }

        let findedUserByEmail = await User.find({ email });
        if (findedUserByEmail.length > 0) {
            return response.send(error(ERROR_CODES.FAILED, "The user with specify email already exists"));
        }

        password = calculateHash(password);

        let user = new User({ login, email, password });
        await user.save();

        request.session.user = user;
        request.session.save();

        response.send(ok());
    } catch (error: any) {
        console.log(error);
    }
})

export default auth;