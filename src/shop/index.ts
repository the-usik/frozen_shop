import expressSession from "express-session"
import express from "express";
import { Logger, UPLOAD_FOLDER_PATH } from "@utils/index";
import { apiRouter, authRouter, mainRouter } from "./routers";
import { join as joinPath } from "path";
import { databaseConnect } from "./database";

const app = express();
const { SERVER_PORT } = process.env;

app.use(express.json());
app.use(
    expressSession({
        secret: (Math.random() * 0xFFFFF ^ 0).toString(32),
        resave: false,
        saveUninitialized: true
    })
);

app.set("view engine", "ejs");
app.set("views", joinPath(__dirname, "views"));
app.use(express.static(joinPath(__dirname, "public")));
app.use("/photos", express.static(UPLOAD_FOLDER_PATH));

app.use((request: any, _, next) => {
    if (!request.session.lang) {
        request.session.lang = 0;
        request.session.auth = 1;
    }

    return next();
})

app.use("/api", apiRouter);
app.use("/auth", authRouter);
app.use("/", mainRouter);

app.use((_, response) => {
    response.render("errors/404");
});

export default function runServer() {
    return new Promise(async resolve => {
        await databaseConnect();
        Logger.log("🍱 Connected to database!");

        app.listen(SERVER_PORT, () => {
            Logger.log(`💽 Server is listening on ${SERVER_PORT} port`)
            resolve(true);
        });
    })
}