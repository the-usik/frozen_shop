import { CANCEL_BUTTON, COMPLETE_BUTTON, EXIT_BUTTON, SKIP_BUTTON, SKIP_INLINE_KEYBOARD } from "@bot/helpers/constants";
import {
    advanceWithExecution, asyncWrapper, buildInlineButtonsFromCollection,
    callApi, fetchState, formatError, formatIncorrect, formatOk, getCleanWord,
    getValidMessageText, sendCancelableMessage
} from "@bot/helpers";

import { BotContext } from "@bot/types";
import { Composer, Context, Markup, Scenes } from "telegraf";
import { replyMenuToContext } from "telegraf-inline-menu/dist/source";
import { calculatePercent, checkRange } from "@utils/helpers";
import { Size, Category } from "@shop/database/models";
import { Logger } from "@utils/logger";
import mainMenu from "@bot/menu/main";
import { ProductData } from "./types";
import { PRODUCT_IMAGE_MIN_HEIGHT, PRODUCT_IMAGE_MIN_WIDTH } from "@utils/constants";

const { SERVER_HOST, SERVER_PORT } = process.env;

interface AddProductContext extends BotContext {
    wizard: Scenes.WizardContextWizard<AddProductContext> & { state: AddProductState }
}

interface AddProductState {
    inited: boolean;
    products: ProductData[];
    currentProduct: ProductData;
    database: DatabaseCollections;
    local: {
        repeat: boolean;
        genders: string[];
        categoryNames: string[];
        sizeNames: string[];
        sizeIndex: number;
    };
}

interface DatabaseCollections {
    sex: any;
    sizes: { name: string }[];
    categories: {
        name_ru: string;
        name_en: string;
    }[];
}

const sizeSelectStep = new Composer<AddProductContext>();

sizeSelectStep.hears(/^[0-9]+$/, async (context) => {
    const { currentProduct, local } = context.wizard.state;
    const sizeRef = currentProduct.sizes[local.sizeIndex];
    if (!sizeRef) return;

    const number = Number(context.message.text);
    sizeRef.count = number;

    local.sizeNames = local.sizeNames.filter(size => sizeRef.name != size);
    local.sizeIndex++;

    const stockListString = currentProduct.sizes.map(({ count, name }) => `🗳 Размер ${name}, кол-во: ${count}шт.`).join("\n");
    const promptString = local.sizeNames.length < 1
        ? "😅 Для всех товаров указана цена, нажмите кнопку пропустить."
        : "🎈 Выберите размер одежды, либо пропустите шаг.";

    return sendSelectSizeKeyboard(
        context,
        formatOk(
            `Отлично, размеры на складе:\n\n${stockListString}\n\n` +
            promptString
        ), true
    );
});

sizeSelectStep.action(/size-(.*)/i, asyncWrapper(
    async context => {
        await context.answerCbQuery();

        const { currentProduct, local } = context.wizard.state;
        if (!context.match) return;
        const [, sizeName] = context.match;

        if (!sizeName) return sendSelectSizeKeyboard(context, "🦺 Пожалуйста, выберите размер одежды!");
        if (!Array.isArray(currentProduct.sizes)) currentProduct.sizes = [];

        currentProduct.sizes[local.sizeIndex] = {
            count: -1,
            name: sizeName
        };

        context.editMessageText(`📜 Выбран размер: ${sizeName}.\n\nУкажите кол-во товаров на складе для этого размера`);
    })
);

const categorySelectStep = new Composer<AddProductContext>();

categorySelectStep.action(/category-(.*)/, asyncWrapper<AddProductContext>(
    async context => {
        const { currentProduct } = context.wizard.state;
        const [, category] = context.match!;
        currentProduct.category = category;

        await context.editMessageText(formatOk(`Отлично! Выбранная категория товара: ${category}\n\nДвигаемся дальше`));
        return advanceWithExecution(context);
    })
);


const sexSelectStep = new Composer<AddProductContext>();

sexSelectStep.action(/sex-(.*)/, asyncWrapper<AddProductContext>(
    async context => {
        const { currentProduct, local } = context.wizard.state;
        const [, genderString] = context.match!;
        let index = local.genders.findIndex(value => value == genderString);
        if (index == -1) index = 0;

        currentProduct.sex = index;

        await context.editMessageText(formatOk(`Выбранный пол: ${getCleanWord(genderString)}`));
        return advanceWithExecution(context);
    }
))

const STILL_OLD_BUTTON = Markup.button.callback("Оставить предыдущее", "skip");

const scene = new Scenes.WizardScene<AddProductContext>(
    "add-product",

    asyncWrapper(async context => {
        await initAddProductState(context);
        await context.reply(
            "🏷 Введите название товара.\n\n" +
            "Название товара будет отображаться на главной странице сайта. Либо оставьте предыдущее название товара, нажав на кнопку.",

            Markup.inlineKeyboard([
                getButtonsForRepeat(context),
                [CANCEL_BUTTON]
            ])
        );

        return context.wizard.next();
    }),

    asyncWrapper(async (context: AddProductContext) => {
        const text = getValidMessageText(context, /.*/i);
        if (!text) return await sendCancelableMessage(context, formatIncorrect("Вы не указали название товара."));

        const state = fetchState<AddProductState>(context);
        state.currentProduct.name = text.trim();

        return advanceWithExecution(context);
    }),

    asyncWrapper(async context => {
        await context.reply(
            "📝 Введите описание товара.", Markup.inlineKeyboard([
                getButtonsForRepeat(context),
                [CANCEL_BUTTON]
            ])
        );

        return context.wizard.next();
    }),

    asyncWrapper(async (context: AddProductContext) => {
        const state = fetchState<AddProductState>(context);
        const text = getValidMessageText(context, /.*/i);

        if (!text) return await sendCancelableMessage(context, formatIncorrect("Вы не указали описание товара."));

        state.currentProduct.description = text.trim();
        return advanceWithExecution(context);
    }),

    asyncWrapper<AddProductContext>(async context => {
        await sendCancelableMessage(context, "💵 Укажите цену товара.");

        return context.wizard.next();
    }),

    asyncWrapper(async (context: AddProductContext) => {
        const text = getValidMessageText(context, /^[0-9]+/i);

        if (!text) return sendCancelableMessage(context, "🐷 Пожалуйста, укажите цену товара, как целое положительное число!");

        const price = Number(text);
        if (price < 1) return context.reply("😑 Отрицательная цена? Так не пойдет, отправьте мне натуральное число:");

        const state = fetchState<AddProductState>(context);
        state.currentProduct.price = Number(price);

        await context.reply(
            "🍩 Укажите скидку на товар, либо пропустите это действие, если у товара её не будет.\n\nЗначения указываются в диапазоне от 1% до 90%.",
            SKIP_INLINE_KEYBOARD
        );

        return context.wizard.next();
    }),

    asyncWrapper(async (context: AddProductContext) => {
        const text = getValidMessageText(context, /^\d+/);
        if (!text) return context.reply(
            formatIncorrect("Пожалуйста, укажите корректное целое число."),
            SKIP_INLINE_KEYBOARD
        );

        const state = fetchState<AddProductState>(context);

        const discount = Number(text.trim());
        if (checkRange(discount, [1, 90])) {
            state.currentProduct.forSale = true;
            state.currentProduct.discount = discount;
            const price = state.currentProduct.price;
            const discountPrice = price - calculatePercent(price, discount);

            await context.reply(formatOk(`Отлично! Цена со скидкой: ${discountPrice}₽`));

            advanceWithExecution(context);
        } else context.reply(formatIncorrect("Пожалуйста, укажите значение в диапазоне от 1 до 90."));
    }),

    asyncWrapper<AddProductContext>(async context => {
        const { database, local } = context.wizard.state;
        const sizeNames = database.sizes.map(size => size.name);
        local.sizeNames = sizeNames;
        local.sizeIndex = 0;

        sendSelectSizeKeyboard(context);
        return context.wizard.next();
    }),

    sizeSelectStep,

    asyncWrapper<AddProductContext>(async context => {
        const { database, local } = context.wizard.state;
        const categoryNames = database.categories.map(category => category.name_ru);
        local.categoryNames = categoryNames;

        const buttons = buildInlineButtonsFromCollection(categoryNames, "category");
        await context.reply("👙 Выберите категорию товара:", Markup.inlineKeyboard(buttons));
        return context.wizard.next();
    }),

    categorySelectStep,

    asyncWrapper(async context => {
        const { local } = context.wizard.state;
        local.genders = ["☺ Унисекс", "👧 Женский", "👨 Мужской"];
        const inlineButtons = buildInlineButtonsFromCollection(local.genders, "sex");

        await context.reply("👽 Выберите пол:", Markup.inlineKeyboard(inlineButtons));
        return context.wizard.next();
    }),

    sexSelectStep,

    asyncWrapper(async context => {
        await context.reply("🎨 Укажите цвет вашего товара");

        return context.wizard.next();
    }),

    asyncWrapper(async context => {
        const text = getValidMessageText(context, /[\sa-zа-я]+$/i);
        const state = fetchState<AddProductState>(context);
        if (!text) return context.reply(formatIncorrect("Укажите нормальный цвет для товара!"));

        state.currentProduct.color = text!;

        await context.reply("🖼️ Укажите фотографию вашего товара\n\nМинимальное разрешение изображения: 1080x1920", Markup.inlineKeyboard([COMPLETE_BUTTON]));

        return context.wizard.next();
    }),

    asyncWrapper<AddProductContext>(async (context) => {
        const { currentProduct } = fetchState<AddProductState>(context);
        Logger.log(currentProduct, context.message);
        const valid = context.message && ("photo" in context.message || "document" in context.message);
        if (!valid) return context.reply(formatIncorrect("Пожалуйста, укажите фотографии вашего товара."));

        const fileIds: string[] = [];

        if ("photo" in context.message!) {
            const photos = context.message.photo;
            const [photo] = photos
                .filter(a => a.file_size)
                .sort((a, b) => a.file_size! < b.file_size! ? 1 : -1);

            if (!validDocumentResolution(photo)) {
                return context.reply(formatIncorrect(`Указанная фотография меньше, чем допустимое разрешение (${PRODUCT_IMAGE_MIN_WIDTH}x${PRODUCT_IMAGE_MIN_HEIGHT})!`));
            }

            fileIds.push(photo.file_id);
        }

        if ("document" in context.message!) {
            const { file_id, mime_type, thumb } = context.message.document;
            if (!mime_type) return;
            if (mime_type.search("image") == -1) return context.reply(formatIncorrect("Документ не содержит изображения."));
            fileIds.push(file_id);
        }

        const results = await Promise.all(
            fileIds.map(fileId => context.telegram.getFileLink(fileId))
        );

        results.forEach(result => currentProduct.imageUrls.push(result.href));
        await context.reply("📲 Ваш файл был загружен.\n\nЗагрузите ещё, либо нажмите кнопку \"Готово\"", Markup.inlineKeyboard([COMPLETE_BUTTON]))
    }),

    asyncWrapper<AddProductContext>(async (context) => {
        const state = fetchState<AddProductState>(context);
        const addResponse = await callApi("product.add", state.currentProduct);

        if (addResponse.error) {
            Logger.error(addResponse.error);

            return context.reply(
                formatError("Произошла ошибка при создании товара!\n\n🙄 Хотите добавить товар повторно?"),
                Markup.inlineKeyboard([
                    [Markup.button.callback("🔂 Добавить товар заново", "repeat")],
                    [EXIT_BUTTON]
                ])
            );
        }

        const insertedId = addResponse.payload;
        const url = `http://${SERVER_HOST}:${SERVER_PORT}/product/${insertedId}`;

        await context.reply(
            "😉 Товар успешно создан.\n\n" +
            `😎 Посмотреть его можно по ссылке:\n\n${url}\n\nХотите добавить ещё товар?`,

            Markup.inlineKeyboard([
                [Markup.button.callback("💎 Добавить ещё товар", "repeat")],
                [EXIT_BUTTON]
            ])
        );
    })
);

scene.action("repeat", asyncWrapper(
    async context => {
        await context.answerCbQuery();

        let state = fetchState<AddProductState>(context);
        const lastState = Object.assign({}, state.currentProduct);

        state = clearState(state);
        state.currentProduct.name = lastState.name;
        state.currentProduct.description = lastState.description;
        state.local.repeat = true;

        context.wizard.selectStep(0);
        return advanceWithExecution(context, -1);
    }
));

scene.action(["skip", "complete"], asyncWrapper(
    async (context) => {
        await context.answerCbQuery();
        await advanceWithExecution(context)
    }
));

scene.action(["back_main_menu", "cancel"], asyncWrapper(
    async context => {
        await context.answerCbQuery();
        await context.scene.leave();
        await replyMenuToContext(mainMenu, context, "/products-menu/");
    }
));

function sendSelectSizeKeyboard(
    context: BotContext,
    message: string = "👚 Выберите размер одежды.",
    skipButton: boolean = false
) {
    const { local } = context.wizard.state;

    const sizeButtons = buildInlineButtonsFromCollection(local.sizeNames, "size");
    const buttons = sizeButtons;

    if (skipButton) buttons.push([SKIP_BUTTON]);

    return context.reply(message, Markup.inlineKeyboard(buttons));
}

function getButtonsForRepeat(context: AddProductContext) {
    const state = fetchState<AddProductState>(context);
    return state.local.repeat ? [STILL_OLD_BUTTON] : [];
}

type DocumentResolutionCheckOptions = {
    width: number,
    height: number;
} & Record<string, any>;

function validDocumentResolution(doc: DocumentResolutionCheckOptions) {
    return doc.width >= PRODUCT_IMAGE_MIN_WIDTH && doc.height >= PRODUCT_IMAGE_MIN_HEIGHT;
}

async function initAddProductState(context: AddProductContext) {
    const state = fetchState<AddProductState>(context);
    if (state.inited) return state;

    state.products = [];
    state.currentProduct = {
        imageUrls: [],
        sizes: [],
        discount: 0,
        category: "",
        color: "",
        description: "",
        name: "",
        price: 0,
        sex: 0,
        forSale: false
    };

    state.database = {
        categories: await Category.find() as [],
        sizes: await Size.find() as [],
        sex: null
    };

    state.local = {
        repeat: false,
        genders: [],
        categoryNames: [],
        sizeNames: [],
        sizeIndex: 0
    };

    state.inited = true;

    return state;
}

function clearState(state: AddProductState) {
    const { local } = state;
    local.genders = [];
    local.categoryNames = [];
    local.sizeNames = [];
    local.sizeIndex = 0;

    state.currentProduct = {
        imageUrls: [],
        sizes: [],
        discount: 0,
        category: "",
        color: "",
        description: "",
        name: "",
        price: 0,
        sex: 0,
        forSale: false
    };

    return state;
}

export default scene;