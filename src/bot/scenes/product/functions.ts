import { calculatePercent, formatPrice } from "@utils/helpers";
import { ProductData, ProductFullData } from "./types";

const genders = ["унисекс", "женский", "мужской"];

export const formatGenders = (id: number) => {
    return genders[id];
}

export const composeStrings = (splitter = "\n", ...args: string[]) => {
    return args.join(splitter)
}

export const productFullDecorator = (product: ProductFullData) => {
    const formattedPrice = formatPrice(product.price);
    const priceText = product.for_sale
        ? `${formatPrice(product.price - calculatePercent(product.price, product.discount))} (<s>${formattedPrice}</s>)`
        : formattedPrice;

    const sizesCount = product.sizes.reduce((acc, { count }) => acc += count, 0);
    const sizeList = product.sizes
        .map(
            ({ size, count }) => {
                return `- ${size.name} (${count}шт.)`;
            }
        ).join("\n\t");

    return composeStrings(
        "\n",
        `Название: <b>${product.name}</b>`,
        `Описание: <b>${product.description}</b>`,
        `Цена: <b>${priceText}</b>`,
        `Цвет: <b>${product.color.toLowerCase() || "Не указано"}</b>`,
        `Размеры:\n\t<b>${sizeList}</b>`,
        `Категория: <b>${product.category.name_ru}</b>`,
        `Общее кол-во: <b>${sizesCount}шт.</b>`,
        `Пол: <b>${genders[product.sex]}</b>`,
        `Фотографий: <b>${product.images.length}</b>`
    );
}

export const productDecorator = (product: ProductData) => {
    const sizesList = product.sizes
        .map(size => `${size.name} (${size.count})`)
        .join("\n\t");

    return composeStrings(
        "\n",
        `Название: ${product.name}`,
        `Описание: ${product.description}`,
        `Цена: ${formatPrice(product.price)}`,
        `Цвет: ${product.color}`,
        `Размеры:\n\t${sizesList}` +
        `Категория: ${product.category.toLowerCase() || "Не указано"}` +
        `Количество: ${product.sizes.reduce((a, size) => a += size.count, 0)}` +
        `Пол: ${genders[product.sex]}`);
}