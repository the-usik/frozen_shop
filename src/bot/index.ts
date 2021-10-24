import { Telegraf, Scenes } from "telegraf";
import LocalSession from "telegraf-session-local";
import { product } from "./scenes";
import menuMiddleware from "./menu";
import { BotContext } from "./types";
import { BOT_SESSIONS_PATH } from "@utils/constants";
import accessScene from "./scenes/access";
import { asyncWrapper } from "./helpers";
import { Category, Size } from "@shop/database/models";

const { TELEGRAM_BOT_TOKEN } = process.env;
const bot = new Telegraf<BotContext>(TELEGRAM_BOT_TOKEN!);
const localSessionStorage = new LocalSession({ database: BOT_SESSIONS_PATH });
const stage = new Scenes.Stage<BotContext>([accessScene, product.add, product.search, product.edit]);

bot.use(localSessionStorage.middleware());
bot.use(stage.middleware());
bot.use(menuMiddleware.middleware());

bot.use(
    async (context, next) => {
        if (context.session.auth) return next();
        await context.scene.enter("password-scene");
    }
);

bot.use(
    async (context, next) => {
        if (!context.session.database) {
            context.session.database = {
                categories: await Category.find() as any,
                sizes: await Size.find() as any
            }
        }

        return next();
    }
);

bot.command("add", asyncWrapper(
    async context => {
        await context.scene.enter("add-product");
    }
))

bot.command("search", asyncWrapper(
    async context => {
        await context.scene.enter("search-product");
    })
)


bot.start(async context => menuMiddleware.replyToContext(context));

export default bot;