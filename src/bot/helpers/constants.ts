import { Markup } from "telegraf";

export const ERROR_EMOJI = "🦞";
export const OK_EMOJI = "🤗";
export const INCORRECT_EMOJI = "🤬";

export const ADD_PRODUCT_BUTTON = "🌀 Добавить";
export const EDIT_PRODUCT_BUTTON = "✏️ Изменить";
export const DELETE_PRODUCT_BUTTON = "🗑 Удалить";
export const SEARCH_PRODUCT_BUTTON = "🔍 Поиск";
export const ALL_PRODUCTS_BUTTON = "📒 Все товары";
export const CANCEL_BUTTON_TEXT = "🔙 Отменить";
export const BACK_MAIN_MENU_TEXT = "🏠 Вернуться к главному меню";

export const SKIP_BUTTON = Markup.button.callback("⏬ Пропустить", "skip");
export const COMPLETE_BUTTON = Markup.button.callback("💾 Готово", "complete");
export const CANCEL_BUTTON = Markup.button.callback(CANCEL_BUTTON_TEXT, "cancel");
export const EXIT_BUTTON = Markup.button.callback(BACK_MAIN_MENU_TEXT, "back_main_menu");

export const CANCEL_INLINE_KEYBOARD = Markup.inlineKeyboard([CANCEL_BUTTON]);
export const SKIP_INLINE_KEYBOARD = Markup.inlineKeyboard([SKIP_BUTTON]);
