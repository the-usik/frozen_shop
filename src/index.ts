require("dotenv").config();

import { Logger } from "@utils/index";
import bot from "./bot";
import runServer from "./shop";

const run = async () => {
    Logger.log("♻ Server starting...")
    await runServer();
    await bot.launch();
    Logger.log("🤖 Bot launched!");
}

run()
    .then(Logger.log)
    .catch(Logger.error);