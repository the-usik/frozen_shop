import axios from "axios";
import { Markup } from "telegraf";
import { CANCEL_BUTTON, CANCEL_INLINE_KEYBOARD, COMPLETE_BUTTON, ERROR_EMOJI, INCORRECT_EMOJI, OK_EMOJI } from "./constants";
import { BotContext } from "../types";
import { createReadStream } from "fs";
import { ApiError } from "@bot/errors";

const { SERVER_HOST, SERVER_PORT } = process.env;

export const storeStateField = (context, field, value) => {
    context.wizard.state[field] = value;
};

export const fetchStateField = (context, field) => {
    return context.wizard.state[field];
}

export const fetchState = <T = any>(context: BotContext): T => {
    return context.wizard.state;
}

export const sendCancelableMessage = (context: any, text: string) => {
    return context.reply(text, CANCEL_INLINE_KEYBOARD);
}

export const numberDeclination = (number, titles) => {
    number = Math.abs(number);
    let cases = [2, 0, 1, 1, 1, 2];

    return titles[
        (number % 100 > 4 && number % 100 < 20)
            ? 2
            : cases[(number % 10 < 5) ? number % 10 : 5]
    ];
}

export const buildInlineButtonsFromCollection = (texts: string[], suffix: string) => {
    let keyboard: any[] = [];
    let rowIndex = 0;
    let colIndex = 0;
    for (let textIndex in texts) {
        if (!Array.isArray(keyboard[rowIndex])) {
            keyboard[rowIndex] = [];
        }

        let text = texts[textIndex];
        let buttonText = suffix ? `${suffix}-${text}` : text;

        let button = Markup.button.callback(text, buttonText);

        keyboard[rowIndex].push(button);

        if (colIndex >= 4) {
            rowIndex++;
            colIndex = 0;
        } else colIndex++;
    }

    return keyboard;
}

export const asyncWrapper = <T extends BotContext = BotContext>(func: (context: T) => any) => {
    return async (context: T) => {
        try { await func(context); } catch (error) {
            let caption = `🥵 Произошла ошибка при обработке команды!\n\n\`${error.stack}\``;
            context.replyWithMarkdown(caption, Markup.inlineKeyboard([CANCEL_BUTTON]));
        }
    }
}

const getMessageText = (context: BotContext) => {
    return (context.message && "text" in context.message) ? context.message.text : null;
}

const validateMessage = (context: BotContext, like: any[] | RegExp | string) => {
    if (!like) throw new Error("The like option isn't found!");

    let { message } = context;
    if (message && "text" in message) {
        if (Array.isArray(like)) {
            return like.includes(message.text);
        }

        return message.text.search(like) > -1;
    } else return false;
}

export const getValidMessageText = (context: BotContext, like: any[] | RegExp | string): string | null => {
    const valid = validateMessage(context, like);
    const text = getMessageText(context);
    if (!valid) return null;

    return valid && text;
}

export const callApi = async (url, data = {}) => {
    const base = `http://${SERVER_HOST}:${SERVER_PORT}/api/`;
    const response = await axios.post(new URL(url, base).toString(), data);

    return response.data;
}

export const callbackButton = (name: string, action: string, hide?: boolean) => {
    return Markup.button.callback(name, action, hide);
}

export const getStreamFromPath = (path: string) => {
    return createReadStream(path);
}

export async function createInlineChoice(context, { field, dataField, dataTransform, inlineKeyboard }) {
    let wizardState = context.wizard.state;

    let [, value] = context.match;
    if (!value) return;

    value = value.trim();

    if (wizardState[field] != value) {
        wizardState[field] = value;
    }

    let data = dataTransform(wizardState[dataField]);
    let unselectedItems = data.filter(data => data != value);
    let inlineButtons = buildInlineButtonsFromCollection(unselectedItems, inlineKeyboard.prefix);

    // let caption = inlineKeyboard.caption + wizardState[field];
    // wizardState[LAST_EDIT_MESSAGE_TEXT_SYMBOL] = caption;

    // await context.editMessageText(caption, Markup.inlineKeyboard([
    //     ...inlineButtons,
    //     [COMPLETE_BUTTON]
    // ]));
}

export async function createInlineSelect(context, { collectionField, collectionDataField, dataTransform, inlineKeyboard }) {
    let wizardState = context.wizard.state;
    let collectionRef = wizardState[collectionField];

    if (!Array.isArray(collectionRef)) {
        wizardState[collectionField] = [];
        collectionRef = wizardState[collectionField];
    }

    let [, value] = context.match;
    if (!value) return;

    let hasSelectedItem = collectionRef.indexOf(value);
    if (hasSelectedItem != -1) {
        if (collectionRef.length > (inlineKeyboard.minSelectedItems || 1)) {
            collectionRef.splice(hasSelectedItem, 1);
        }
    } else collectionRef.push(value);

    let unselectedItems = dataTransform(wizardState[collectionDataField]).filter(name => !collectionRef.includes(name));
    let inlineButtons = buildInlineButtonsFromCollection(unselectedItems, inlineKeyboard.prefix);

    let list = (inlineKeyboard.displayList ? buildStringList(collectionRef) : "");
    let caption = inlineKeyboard.caption + list;
    // wizardState[LAST_EDIT_MESSAGE_TEXT_SYMBOL] = caption;

    await context.editMessageText(caption,
        Markup.inlineKeyboard([
            ...inlineButtons,
            [COMPLETE_BUTTON]
        ])
    );
}

export function buildStringList(array: any[] = []) {
    return array.map(a => "🔹 " + a).join("\n");
}

export function advanceWithExecution<T extends BotContext>(context: T, offset = 0) {
    context.wizard.selectStep(context.wizard.cursor + offset + 1);

    const stepHandler = context.wizard.step;
    if (!stepHandler) return false;

    const next = async () => {
        context.wizard.next();
    }

    if ("middleware" in stepHandler) {
        return stepHandler.middleware()(context, next);
    } else {
        return stepHandler(context, next);
    }
}

export const getCleanWord = (text: string) => {
    const startIndex = text.search(/\s+/);
    return text.slice(startIndex, text.length).trim();
}

export function formatError(message: string) {
    return `${ERROR_EMOJI} ${message}`;
}

export function formatOk(message: string) {
    return `${OK_EMOJI} ${message}`;
}

export function formatIncorrect(message: string) {
    return `${INCORRECT_EMOJI} ${message}`;
}
