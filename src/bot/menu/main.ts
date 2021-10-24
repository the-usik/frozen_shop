import { callApi } from "@bot/helpers";
import { MenuTemplate } from "telegraf-inline-menu/dist/source";
import { BotContext } from "../types";
import productsMenu from "./product";

const mainMenu = new MenuTemplate<BotContext>(() => "😀 Добро пожаловать, я бот для управления FrozenShop.\n\nВыберите пункт меню.");

mainMenu.submenu("📦 Товары", "products-menu", productsMenu);

mainMenu.interact("💎 Статистика", "stats-menu", {
    async do() { return true },
    joinLastRow: true
});

mainMenu.interact("🧾 Заказы", "orders-menu", {
    async do(context) {
        const response = await callApi("/api/order.get");

        if (response.error) {
            await context.reply("📛 Произошла ошибка: " + response.error.message);
        }

        const orders = response.payload;

        if (orders.length < 1) {
            await context.reply("📪 Список заказов пуст.");
            return false;
        }

        let message = `📦 Заказы (${orders.length}):\n\n`;
        
        const addRow = (name: string, value: any) => (`\t${name}: <i>${value}</i>\n`);

        for (let order of orders) {
            let chunk = `<b>Заказ "${order._id}"</b>\n`;

            let username = order.user.full_name || order.user.login
            let date = new Date(order.date).toLocaleString();
            let price = isNaN(order.price) ? order.price.$numberDecimal : order.price;
            
            chunk += addRow("Клиент", username);
            chunk += addRow("Время", date);
            chunk += addRow("Кол-во товаров", order.products.length);
            chunk += addRow("Цена", Number(price).toLocaleString("ru") + " руб.");
            
            message += chunk + "\n";
        }

        await context.reply(message, {
            parse_mode: "HTML"
        });
        return true
    }
});

mainMenu.interact("👨‍👩‍👧‍👦 Клиенты", "clients-menu", {
    async do() { return true },
    joinLastRow: true
});

export default mainMenu;