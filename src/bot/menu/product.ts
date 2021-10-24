import { createBackMainMenuButtons, MenuTemplate } from "telegraf-inline-menu/dist/source";
import { ADD_PRODUCT_BUTTON, BACK_MAIN_MENU_TEXT, SEARCH_PRODUCT_BUTTON } from "../helpers/constants";
import { BotContext } from "../types";

let productsMenu = new MenuTemplate<BotContext>(() => "Добро пожаловать в меню товаров.");

productsMenu.interact(ADD_PRODUCT_BUTTON, "add-product", {
    async do(context) {
        await context.scene.enter("add-product");
        return true;
    }
});

productsMenu.interact(SEARCH_PRODUCT_BUTTON, "search-product", {
    async do(context) {
        await context.scene.enter("search-product");
        return true;
    },
    joinLastRow: true
});

productsMenu.manualRow(createBackMainMenuButtons("👈 Назад", BACK_MAIN_MENU_TEXT));

export default productsMenu;