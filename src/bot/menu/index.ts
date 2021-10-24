import { BotContext } from "@bot/types";
import { MenuMiddleware } from "telegraf-inline-menu/dist/source";
import mainMenu from "./main";

const menuMiddleware = new MenuMiddleware<BotContext>("/", mainMenu);

export default menuMiddleware;


