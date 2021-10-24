import {
    BACK_MAIN_MENU_TEXT, CANCEL_BUTTON, CANCEL_BUTTON_TEXT,
    DELETE_PRODUCT_BUTTON, EDIT_PRODUCT_BUTTON, EXIT_BUTTON, SKIP_BUTTON
} from "@bot/helpers/constants";

import { asyncWrapper, callApi, fetchState, formatError, formatOk, getValidMessageText, numberDeclination } from "@bot/helpers";
import { Markup, Scenes } from "telegraf";
import { replyMenuToContext } from "telegraf-inline-menu/dist/source";
import mainMenu from "@bot/menu/main";
import { BotContext } from "@bot/types";
import { Logger } from "@utils/logger";
import { ProductFullData } from "./types";
import { productFullDecorator } from "./functions";

interface SearchProductContext extends BotContext {
    wizard: Scenes.WizardContextWizard<BotContext> & { state: SearchProductState }
}

interface SearchProductState {
    items: ProductFullData[];
    selectedProduct: ProductFullData;
}

const FIND_TEXT_VARIANTS = ["Найден", "Найдено", "Найдено"];
const PRODUCT_TEXT_VARTIANTS = ["Товар", "Товара", "Товаров"];

const scene = new Scenes.WizardScene<SearchProductContext>(
    "search-product",

    asyncWrapper(async context => {
        await context.reply("🔎 Поиск по названию товара.\n\nВведите ваш запрос:", Markup.inlineKeyboard([CANCEL_BUTTON]));
        return context.wizard.next();
    }),

    asyncWrapper(async context => {
        const text = getValidMessageText(context, /.+/);
        if (!text) return context.reply("🧬 Введите корректный запрос!", Markup.inlineKeyboard([CANCEL_BUTTON]));

        const { success, payload, error } = await callApi("product.search", { query: text.trim() });

        if (!success) {
            Logger.error("Search error:", error);
            return context.reply(
                formatError("Ошибка при выполнении запроса!\n\nПодробнее: " + JSON.stringify(error)),
                Markup.inlineKeyboard([CANCEL_BUTTON])
            );
        }

        if (payload.count < 1) return context.reply("🥶 По вашему запросу ничего не найдено!\n\n🔎 Введите новый запрос:", Markup.inlineKeyboard([CANCEL_BUTTON]));

        const state = fetchState<SearchProductState>(context);
        state.items = payload.items;

        const findedText = numberDeclination(payload.count, FIND_TEXT_VARIANTS)
        const productText = numberDeclination(payload.count, PRODUCT_TEXT_VARTIANTS);

        const buttons: any[] = [];
        for (let item of payload.items) {
            const button = Markup.button.callback(`${item.name.trim()} (${item.color.toLowerCase()})`, `product-${item._id}`);
            buttons.push([button]);
        }

        buttons.push([CANCEL_BUTTON]);

        await context.reply(
            `🥶 ${findedText} ${payload.count} ${productText.toLowerCase()}.\n\n` +
            "🙋‍♂️ Нажмите на название одного из товаров, чтобы произвести над ним действия.",
            Markup.inlineKeyboard(buttons)
        );
    }),
);

scene.action(
    ["cancel", "skip"], asyncWrapper(async context => {
        await context.answerCbQuery();

        await replyMenuToContext(mainMenu, context, "/");
        return context.scene.leave();
    })
);

scene.action(
    /product-([a-z0-9]+)/i, asyncWrapper(async context => {
        await context.answerCbQuery();
        const state = fetchState<SearchProductState>(context);
        const [, selectedItemId] = context.match!;

        const product = state.items.find(item => item._id == selectedItemId);
        if (!product) return context.reply(formatError("Неожиданная ошибка, попробуйте найти продукт ещё раз."));

        state.selectedProduct = product;
        await sendSelectedItem(context, product);
    })
);

scene.action(
    "edit-product", asyncWrapper(async context => {
        await context.answerCbQuery();
        const { selectedProduct } = fetchState<SearchProductState>(context);
        await context.scene.leave();
        return context.scene.enter("edit-product", { product: selectedProduct });
    })
)

scene.action(
    "delete-confirmation-product", asyncWrapper(async context => {
        await context.answerCbQuery();
        const state = fetchState<SearchProductState>(context);
        const inlineKeyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback(DELETE_PRODUCT_BUTTON, "delete-product"),
                Markup.button.callback(CANCEL_BUTTON_TEXT, "cancel"),
            ]
        ]);

        await context.editMessageText(`Вы уверены, что хотите удалить товар "${state.selectedProduct.name}"?`, inlineKeyboard);
    })
);

scene.action(
    "delete-product", asyncWrapper(async context => {
        await context.answerCbQuery();
        const { selectedProduct } = fetchState<SearchProductState>(context);
        const response = await callApi("product.delete", { id: selectedProduct._id })
        if (!response.success) return context.reply("Ошибка при удалении товара: " + response.error.message)

        await context.reply(formatOk(`Товар "${selectedProduct.name}" (${selectedProduct.color}) успешно удален!`));
        await replyMenuToContext(mainMenu, context, "/products-menu/");
        return context.scene.leave();
    })
);

function sendSelectedItem(context: BotContext, selectedItem: ProductFullData) {
    const controlButtons = [
        Markup.button.callback(EDIT_PRODUCT_BUTTON, "edit-product"),
        Markup.button.callback(DELETE_PRODUCT_BUTTON, "delete-confirmation-product")
    ];

    const keyboard = Markup.inlineKeyboard([
        controlButtons,
        [Markup.button.callback(BACK_MAIN_MENU_TEXT, "skip")]
    ]);

    const messageText =
        `🙉 Вы выбрали ${selectedItem.name}\n\n` + productFullDecorator(selectedItem);

    return context.editMessageText(
        `${messageText}\n\nВыберите действия над этим товаром.`, {
        parse_mode: "HTML", ...keyboard
    }
    );
}

export default scene;
