import menuMiddleware from "@bot/menu";
import { asyncWrapper } from "@bot/helpers";
import { Scenes } from "telegraf";

const { TELEGRAM_BOT_PASSWORD } = process.env;

if (!TELEGRAM_BOT_PASSWORD) throw new Error("Invalid env file. Check your TELEGRAM_BOT_PASSWORD param");

const accessScene = new Scenes.WizardScene("password-scene",
    asyncWrapper(async context => {
        await context.reply("🔒 Введите пароль:")
        return context.wizard.next();
    }),
    asyncWrapper(async context => {
        if (context.message && "text" in context.message) {
            let { text } = context.message;

            if (text.trim() == TELEGRAM_BOT_PASSWORD) {
                context.session.auth = true;
                context.scene.leave();
                return menuMiddleware.replyToContext(context);
            } else context.reply("🤬 Неправильный пароль!")
        }
    })
);

export default accessScene;