import {
    asyncWrapper, buildInlineButtonsFromCollection, callApi, callbackButton, CANCEL_BUTTON, CANCEL_INLINE_KEYBOARD,
    COMPLETE_BUTTON, fetchState,
    formatIncorrect, formatOk, getStreamFromPath,
    getValidMessageText
} from "@bot/helpers";
import { BotContext } from "@bot/types";
import { formatPrice, getMediaDirectPath } from "@utils/helpers";
import { Composer, Markup, Scenes } from "telegraf";
import { formatGenders, productDecorator, productFullDecorator } from "./functions";
import { ProductFullData } from "./types";

interface EditProductContext extends BotContext {
    wizard: Scenes.WizardContextWizard<BotContext> & { state: EditProductState }
}

const EDIT_FLAGS = {
    ADD: 1,
    UPDATE: 2,
    DELETE: 3
}

interface EditProductData {
    name: string;
    color: string;
    description: string;
    categoryId: string;
    sizes: any[];
    imageIds: string[];
    sex: number;
    price: number;
    discount: number;
}

interface EditProductState {
    product: ProductFullData;
    updatedProduct: Partial<EditProductData>;
    temporary: any;
}

const enum EditOption {
    NAME = "edit-name",
    DESCRIPTION = "edit-description",
    PRICE = "edit-price",
    DISCOUNT = "edit-discount",
    COLOR = "edit-color",
    SIZE = "edit-size",
    CATEGORY = "edit-category",
    IMAGE = "edit-image",
    SEX = "edit-sex"
}

const enum EditCursor {
    SELECTOR = 1,
    NAME = 2,
    DESCRIPTION = 3,
    PRICE = 4,
    DISCOUNT = 8,
    SIZE = 0xfffff,
    COLOR,
    IMAGE,
    CATEGORY,
    SEX
}

const EDIT_BUTTONS = [
    [callbackButton("Название", EditOption.NAME)],
    [
        callbackButton("Описание", EditOption.DESCRIPTION),
        callbackButton("Цена", EditOption.PRICE),
        callbackButton("Скидка", EditOption.DISCOUNT),
        callbackButton("Изображение", EditOption.IMAGE),
    ],
    [
        callbackButton("Размер", EditOption.SIZE),
        callbackButton("Цвет", EditOption.COLOR),
        callbackButton("Категория", EditOption.CATEGORY),
        callbackButton("Пол", EditOption.SEX),
    ],
    [
        COMPLETE_BUTTON
    ]
];

const editActionComposer = {
    async [EditOption.NAME](context: EditProductContext) {
        const { updatedProduct } = context.wizard.state;
        const name = updatedProduct!.name;
        await context.editMessageText(`🗿 Текущее наименование одежды: <b>${name}</b>\n\nВведите <b>новое</b> название:`, { ...CANCEL_INLINE_KEYBOARD, parse_mode: "HTML" });
        return context.wizard.selectStep(EditCursor.NAME);
    },

    async [EditOption.DESCRIPTION](context: EditProductContext) {
        const { updatedProduct } = context.wizard.state;
        const description = updatedProduct!.description;
        await context.editMessageText(`🗿 Текущее описание одежды: <b>${description}</b>\n\nВведите <b>новое</b> описание:`, { ...CANCEL_INLINE_KEYBOARD, parse_mode: "HTML" });
        return context.wizard.selectStep(EditCursor.DESCRIPTION);
    },

    async [EditOption.PRICE](context: EditProductContext) {
        const { updatedProduct } = context.wizard.state;
        const price = updatedProduct!.price;
        await context.editMessageText(`🗿 Текущая цена одежды: <b>${formatPrice(price)}</b>\n\nВведите <b>новую</b> цену:`, { ...CANCEL_INLINE_KEYBOARD, parse_mode: "HTML" });
        return context.wizard.selectStep(EditCursor.PRICE);
    },

    async [EditOption.DISCOUNT](context: EditProductContext) {
        const { updatedProduct } = context.wizard.state;
        const discount = updatedProduct!.discount;
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback("🗑 Убрать", "delete-discount")],
            [CANCEL_BUTTON]
        ]);

        await context.editMessageText(
            `🗿 Текущая скидка на товар: <b>${discount}%</b>\n\n<b>Измените</b> скидку, либо <b>уберите</b> её:`,
            { ...keyboard, parse_mode: "HTML" }
        );

        return context.wizard.selectStep(EditCursor.DISCOUNT);
    },

    async [EditOption.COLOR](context: EditProductContext) {
        const { updatedProduct,  } = context.wizard.state;
        const colorName = updatedProduct!.color;
        await context.editMessageText(
            `🗿 Текущий цвет одежды: <b>${colorName}</b>\n\n` +
            "Введите <b>новое</b> название:",
            { ...CANCEL_INLINE_KEYBOARD, parse_mode: "HTML" }
        );

        return context.wizard.selectStep(EditCursor.COLOR);
    },

    async [EditOption.SEX](context: EditProductContext) {
        const { updatedProduct } = context.wizard.state;
        const sexTypeId = updatedProduct!.sex!;
        const genderName = formatGenders(sexTypeId);

        await context.editMessageText(
            `🗿 Текущий пол одежды: <b>${genderName}</b>\n\n` +
            "<b>Выберите</b> новый пол одежды, либо <b>отмените</b> это действие, чтобы оставить значение прежним:",
            { ...CANCEL_INLINE_KEYBOARD, parse_mode: "HTML" }
        );

        return context.wizard.selectStep(EditCursor.SEX);
    },

    async [EditOption.SIZE](context: EditProductContext) {
        const { updatedProduct } = context.wizard.state;

        const sizeList = updatedProduct!.sizes.map(({ name, count }) => {
            const isEmpty = count < 1;
            const emptyDecorator = isEmpty ? "<b>(закончился)</b>" : "";
            const text = `- размер: <b>${name}</b>, кол-во: <b>${count}шт.</b> ${emptyDecorator}`
            return text;
        }).join("\n");

        const buttons = buildInlineButtonsFromCollection(updatedProduct!.sizes.map(productSize => productSize.name), "size")
        const keyboard = Markup.inlineKeyboard([...buttons, [CANCEL_BUTTON]]);

        await context.editMessageText(
            `Размеры:\n${sizeList}\n\n<b>Выберите</b> один из размеров товара, либо <b>добавьте</b> новый.`, {
            ...keyboard, parse_mode: "HTML"
        });

        return context.wizard.selectStep(EditCursor.SIZE);
    }
}

const selector = new Composer<EditProductContext>();

for (let editAction in editActionComposer) {
    const handler = editActionComposer[editAction];
    selector.action(
        editAction, asyncWrapper(async context => {
            await context.answerCbQuery();
            await handler(context);
        })
    );
}

const MAX_PHOTOS = 3;

const scene = new Scenes.WizardScene<EditProductContext>(
    "edit-product",

    // INITAL STAGE 
    asyncWrapper(sendInitialMessage),

    // SELECTOR
    selector,

    // NAME
    asyncWrapper<EditProductContext>(async context => {
        const { state } = context.wizard;
        const text = getValidMessageText(context, /^[a-zа-я\s]+$/i);
        if (!text) return context.reply(formatIncorrect("Название товара должно состоять только из букв!\n\nПовторите ещё раз:"));

        state.updatedProduct!.name = text;
        await context.reply(formatOk("Название товара успешно изменено!"));
        await sendInitialMessage(context);
    }),

    // DESCRIPTION
    asyncWrapper<EditProductContext>(async context => {
        const { state } = context.wizard;
        const text = getValidMessageText(context, /.+/i);
        if (!text) return context.reply(formatIncorrect("Некорректное описание товара.\n\nПовторите ещё раз:"));

        state.updatedProduct!.description = text;
        await context.reply(formatOk("Описание товара успешно изменено!"));
        await sendInitialMessage(context);
    }),

    // PRICE
    asyncWrapper<EditProductContext>(async context => {
        const { state } = context.wizard;
        const text = getValidMessageText(context, /^[0-9]+$/i);
        const price = Number(text);
        if (!text || price < 1) return context.reply(formatIncorrect("Некорректная цена товара. Пожалуйста, в качестве цены укажите только натуральное число.\n\nПовторите ещё раз:"));

        state.updatedProduct!.price = price;
        await context.reply(formatOk("Цена товара успешно изменена!"));
        await sendInitialMessage(context);
    }),

    // DISCOUNT
    asyncWrapper<EditProductContext>(async context => {
        const { state } = context.wizard;
        const text = getValidMessageText(context, /^[0-9]+$/i);
        const price = Number(text);
        if (!text || price < 1) return context.reply(formatIncorrect("Некорректная цена товара. Пожалуйста, в качестве цены укажите только натуральное число.\n\nПовторите ещё раз:"));

        state.updatedProduct!.price = price;
        await context.reply(formatOk("Цена товара успешно изменена!"));
        await sendInitialMessage(context);
    }),
);

scene.action(
    /size-(.*)/, asyncWrapper(async context => { })
)

scene.action(
    "complete", asyncWrapper(async context => {
        await context.answerCbQuery();
        await context.scene.leave();
        callApi("product.edit", context.wizard.state.updatedProduct);
        await context.reply("Данные сохранены...");
    })
);

scene.action(
    "cancel", asyncWrapper(async context => {
        return sendInitialMessage(context);
    })
);

async function sendInitialMessage(context: EditProductContext) {
    context.wizard.selectStep(0);
    const state = fetchState<EditProductState>(context);

    if (!state.updatedProduct) {
        initUpdateProductState(state);
    }

    const photoGroup = getPhotoGroup(state.product.name, state.product.images);
    const decoratedProduct = productFullDecorator(state.product);

    await context.replyWithMediaGroup(photoGroup);
    await context.reply("✏ <b>Изменение товара.</b>\n\n" + decoratedProduct + "\n\nЧто хотите поменять?", {
        ...Markup.inlineKeyboard(EDIT_BUTTONS),
        parse_mode: "HTML"
    });

    return context.wizard.next();
}

function initUpdateProductState(state: EditProductState) {
    const { product } = state;

    state.updatedProduct = {
        name: product.name,
        description: product.description,
        color: product.color,
        sex: product.sex,
        discount: product.discount,
        price: product.price,
        sizes: product.sizes.map(
            ({ count, size }) => ({
                count,
                name: size.name
            })
        ),
        categoryId: product.category._id,
        imageIds: product.images.map(image => image._id)
    }
}

function getPhotoGroup(name: string, images: any[]) {
    const slicedImages = images.slice(0, MAX_PHOTOS);
    const imagePaths = slicedImages.map(image => getMediaDirectPath(image.filename));
    const streams = imagePaths.map(getStreamFromPath);
    const photoGroup: any = streams.map(
        (stream, index) => ({
            type: "photo",
            media: { source: stream },
            caption: `${name} №${index + 1}`
        })
    );

    return photoGroup;
}

// scene.action(
//     "back_to_main", asyncWrapper(async context => {
//         await context.answerCbQuery();
//         await context.scene.leave();

//         await context.deleteMessage();
//         productMiddleware.replyToContext(context);
//     })
// )

// async function sendInitStage(context) {
//     let { state } = context.wizard;
//     let { item } = state;

//     if (!state.convertedItem) {
//         state.convertedItem = {
//             ...item,
//             sizes: item.sizes.map(size => size.name),
//             type: item.type && item.type.name_ru,
//         }
//     }

//     let inlineKeyboard = Markup.inlineKeyboard([
//         [
//             Markup.button.callback("Название", "edit-name"),
//             Markup.button.callback("Описание", "edit-description"),
//             Markup.button.callback("Цена", "edit-price"),
//             Markup.button.callback("Скидка", "edit-discount"),
//         ],
//         [
//             Markup.button.callback("Размер", "edit-size"),
//             Markup.button.callback("Количество", "edit-count"),
//             Markup.button.callback("Категория", "edit-category"),
//             Markup.button.callback("Пол", "edit-sex"),
//         ],
//         [
//             Markup.button.callback("Изображения", "edit-images"),
//         ],
//         [Markup.button.callback("Ⓜ Сохранить данные", "save")],
//         [Markup.button.callback(BACK_MAIN_MENU_TEXT, "back_to_main")],
//     ]);

//     let { convertedItem } = state;

//     let discountText = convertedItem.for_sale ? `🤑 Цена со скидкой: ${calcPercent(convertedItem.price, convertedItem.discount).toFixed(2)}₽ (скидка: ${convertedItem.discount}%)\n` : "";
//     let text = `📕 Изменение товара "${convertedItem.name}".\n\n` +
//         `🔖 Название: ${convertedItem.name}\n` +
//         `📑 Описание: ${convertedItem.description}\n` +
//         `💷 Цена: ${convertedItem.price}\n` + discountText +
//         `🎩 Размеры: ${convertedItem.sizes.join(", ")}\n` +
//         `👕 Категория: ${convertedItem.type || "Не указано"}\n` +
//         `🔢 Количество: ${convertedItem.count}\n` +
//         `🎭 Пол: ${convertedItem.sex}\n\n`;

//     let [photo] = convertedItem.images || [];
//     let { SERVER_HOST, SERVER_PORT } = process.env;
//     let photoUrl = new URL(photo, `http://${SERVER_HOST}:${SERVER_PORT}/`);
//     let photoLoaded;

//     try {
//         await context.replyWithPhoto({ url: photoUrl }, { caption: text });
//         photoLoaded = true;
//     } catch (error) { photoLoaded = false; }

//     await context.reply(`${!photoLoaded ? text : ""}◽ Выберите пункт, который хотите изменить`, inlineKeyboard)
// }



export default scene;